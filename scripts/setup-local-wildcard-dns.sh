#!/usr/bin/env bash
#
# Aktifkan wildcard DNS lokal untuk domain tenant, mis. *.rabasha.id -> 127.0.0.1.
#
# Kenapa perlu: /etc/hosts TIDAK mendukung wildcard, jadi entri `*.rabasha.id` di
# /etc/hosts hanya string biasa dan subdomain tenant (tenant-x.rabasha.id) tidak
# pernah resolve -> browser DNS_PROBE_FINISHED_NXDOMAIN sebelum sampai Caddy.
#
# Skrip ini menjalankan dnsmasq di 127.0.0.1:53 yang menjawab <apa pun>.<DOMAIN>
# dengan 127.0.0.1, lalu meneruskan query lain ke upstream DNS yang sedang dipakai.
# systemd-resolved tetap resolver utama; hanya domain ini yang dirutekan ke dnsmasq.
#
# Pemakaian:
#   sudo bash scripts/setup-local-wildcard-dns.sh [DOMAIN] [UPSTREAM_DNS...]
# Contoh:
#   sudo bash scripts/setup-local-wildcard-dns.sh rabasha.id
#   sudo bash scripts/setup-local-wildcard-dns.sh rabasha.id 113.197.109.11 113.197.109.1
#
# Idempotent: aman dijalankan ulang. Rollback ada di bagian akhir (komentar).

set -euo pipefail

DOMAIN="${1:-rabasha.id}"
shift || true
UPSTREAMS=("$@")
DOMAIN_PROBE="probe.$DOMAIN"   # hostname uji wildcard (tidak ada di /etc/hosts)

if [[ $EUID -ne 0 ]]; then
  echo "Harus dijalankan sebagai root:  sudo bash scripts/setup-local-wildcard-dns.sh $DOMAIN" >&2
  exit 1
fi

# --- path konfigurasi ---------------------------------------------------------
CONF="/etc/dnsmasq.d/rabasha-local.conf"
DISPATCHER="/etc/NetworkManager/dispatcher.d/99-rabasha-local-dns"
LEGACY_NM_CONF="/etc/NetworkManager/conf.d/99-rabasha-local-dns.conf"

# --- deteksi link + upstream DNS aktif bila tidak diberikan eksplisit ----------
LINK="$(ip -o link show up | awk -F': ' '$2!="lo" && $2!~/^(docker|br-|virbr|veth)/ {print $2; exit}')"
echo "→ Interface: ${LINK:-<tidak terdeteksi>}"

# Loopback DIKECUALIKAN: setelah setup ini link memang berisi 127.0.0.1 (dnsmasq).
# Bila ikut terbaca saat re-run, dnsmasq akan meneruskan query ke dirinya sendiri.
if [[ ${#UPSTREAMS[@]} -eq 0 ]] && command -v resolvectl >/dev/null 2>&1 && [[ -n "${LINK:-}" ]]; then
  mapfile -t UPSTREAMS < <(
    resolvectl status "$LINK" \
      | awk '/DNS Servers:/ {for (i=3;i<=NF;i++) if ($i ~ /^[0-9]/) print $i}' \
      | grep -vE '^(127\.|0\.0\.0\.0)' | sort -u || true
  )
fi
# Fallback: upstream yang sudah tersimpan di conf dnsmasq (tahan re-run).
if [[ ${#UPSTREAMS[@]} -eq 0 ]] && [[ -f "$CONF" ]]; then
  mapfile -t UPSTREAMS < <(sed -n 's/^server=//p' "$CONF" | sort -u || true)
fi
if [[ ${#UPSTREAMS[@]} -eq 0 ]]; then
  UPSTREAMS=(1.1.1.1 8.8.8.8)
fi
echo "→ Upstream DNS: ${UPSTREAMS[*]}"

# --- pasang dnsmasq (package lengkap, menyediakan systemd unit) ----------------
if ! systemctl list-unit-files 2>/dev/null | grep -q '^dnsmasq.service'; then
  echo "→ Install package dnsmasq…"
  DEBIAN_FRONTEND=noninteractive apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq dnsmasq
fi

# --- tulis konfigurasi wildcard -----------------------------------------------
cat > "$CONF" <<EOF
# Dibuat oleh scripts/setup-local-wildcard-dns.sh — jangan edit manual.
# Bind hanya ke loopback supaya tidak bentrok dengan systemd-resolved (127.0.0.53).
listen-address=127.0.0.1
bind-interfaces
# Wildcard: seluruh <sub>.$DOMAIN dan $DOMAIN sendiri dijawab 127.0.0.1.
address=/$DOMAIN/127.0.0.1
# Teruskan query lain ke upstream asli.
$(for s in "${UPSTREAMS[@]}"; do echo "server=$s"; done)
EOF
echo "→ Tulis $CONF:"
sed 's/^/    /' "$CONF"

# Pastikan /etc/dnsmasq.conf benar-benar meng-include /etc/dnsmasq.d/.
if ! grep -qE '^\s*conf-dir=/etc/dnsmasq\.d' /etc/dnsmasq.conf 2>/dev/null; then
  printf '\n# Ditambahkan oleh setup-local-wildcard-dns.sh\nconf-dir=/etc/dnsmasq.d/,*.conf\n' >> /etc/dnsmasq.conf
  echo "→ Tambah 'conf-dir=/etc/dnsmasq.d/,*.conf' ke /etc/dnsmasq.conf"
fi

# --- arahkan systemd-resolved: SELURUH query -> dnsmasq (127.0.0.1) -----------
# PENTING: jangan pasang upstream asli di link yang sama. systemd-resolved
# menanyai semua server pada satu link secara paralel, dan bila $DOMAIN tidak
# terdaftar publik, upstream asli membalas NXDOMAIN yang bisa menang balapan
# dengan jawaban benar dari dnsmasq -> browser dapat "name not found".
# Jadi biarkan dnsmasq sebagai satu-satunya server; dia yang meneruskan query
# lain ke upstream (lihat server= di $CONF).
if command -v resolvectl >/dev/null 2>&1 && [[ -n "${LINK:-}" ]]; then
  resolvectl dns "$LINK" 127.0.0.1
  resolvectl domain "$LINK" "~$DOMAIN"
  resolvectl flush-caches
  echo "→ resolvectl: $LINK -> 127.0.0.1 saja (upstream diteruskan oleh dnsmasq)"
fi

# --- persist: NetworkManager dispatcher script --------------------------------
# Mengapa BUKAN opsi lain (hasil investigasi lapangan di mesin ini):
#  - `dns=`/`dns-search=` di section [connection-<nama>] DIABAIKAN NetworkManager
#    (`man NetworkManager.conf` > CONNECTION SECTION > Supported Properties:
#    ipv4.dns/ipv4.dns-search TIDAK ada di daftar properti yang didukung).
#  - Profil koneksi di sini dibuat netplan ke /run/NetworkManager/system-connections/
#    (tmpfs) dan dibuat ulang setiap boot -> `nmcli connection modify` TIDAK persisten.
# Solusi: dispatcher script. NetworkManager menjalankannya tiap interface naik,
# dan isinya menerapkan PERSIS state yang sudah terbukti bekerja di atas (resolvectl).
cat > "$DISPATCHER" <<EOF
#!/bin/bash
# Dibuat oleh scripts/setup-local-wildcard-dns.sh — jangan edit manual.
# Tujuan: <apa pun>.$DOMAIN -> 127.0.0.1 lewat dnsmasq lokal.
# NetworkManager memanggil script ini dengan: \$1 = interface, \$2 = action.
# NM hanya menjalankan script milik root, executable, tidak writable group/other.
DOMAIN="$DOMAIN"

case "\$2" in
  up|dhcp4-change|dhcp6-change|connectivity-change) ;;
  *) exit 0 ;;
esac

# Hanya untuk interface yang memegang default route (lewati docker0/br-*/veth).
ip route show default dev "\$1" 2>/dev/null | grep -q . || exit 0

# dnsmasq = SATU-SATUNYA DNS server link ini. Ini mencegah upstream publik
# membalas NXDOMAIN untuk $DOMAIN (domain ini tidak terdaftar publik) dan
# memenangkan balapan melawan jawaban benar dari dnsmasq.
resolvectl dns "\$1" 127.0.0.1
resolvectl domain "\$1" "~\$DOMAIN"
resolvectl flush-caches
EOF
chmod 755 "$DISPATCHER"
chown root:root "$DISPATCHER"
echo "→ Pasang dispatcher: $DISPATCHER"

# Bersihkan file lama yang tidak berpengaruh (dns= di NetworkManager.conf diabaikan).
if [[ -f "$LEGACY_NM_CONF" ]]; then
  rm -f "$LEGACY_NM_CONF"
  echo "→ Hapus $LEGACY_NM_CONF (tidak dipakai: kunci dns= di section [connection-*] diabaikan)"
  if command -v nmcli >/dev/null 2>&1; then
    nmcli general reload conf >/dev/null 2>&1 || true
  fi
fi

# --- bersihkan wildcard palsu di /etc/hosts -----------------------------------
if grep -qE "^\s*[0-9.:]+\s+.*\*\.$DOMAIN" /etc/hosts 2>/dev/null; then
  cp -n /etc/hosts /etc/hosts.bak.rabasha 2>/dev/null || true
  sed -i -E "s/[[:space:]]*\*\.$DOMAIN//g" /etc/hosts
  echo "→ Hapus entri wildcard (tidak berfungsi) dari /etc/hosts (backup: /etc/hosts.bak.rabasha)"
fi

# --- jalankan ulang dnsmasq ---------------------------------------------------
systemctl enable --now dnsmasq >/dev/null 2>&1 || true
systemctl restart dnsmasq
sleep 1

# --- verifikasi ---------------------------------------------------------------
echo
echo "→ Verifikasi:"

ok=1

# 1) dnsmasq langsung — membuktikan wildcard-nya sendiri benar.
if command -v dig >/dev/null 2>&1; then
  direct="$(dig +short +timeout=3 +tries=1 "@127.0.0.1" "probe.$DOMAIN" 2>/dev/null | grep -m1 '^[0-9]' || true)"
  if [[ "$direct" == "127.0.0.1" ]]; then
    echo "    [ok]   dnsmasq 127.0.0.1:53  probe.$DOMAIN -> 127.0.0.1"
  else
    ok=0
    echo "    [FAIL] dnsmasq 127.0.0.1:53  probe.$DOMAIN -> '${direct:-kosong}'"
    echo "           Cek: systemctl status dnsmasq --no-pager"
    echo "           dan: journalctl -u dnsmasq -n 30 --no-pager"
  fi
fi

# 2) jalur end-to-end lewat systemd-resolved (inilah yang dipakai browser/getent).
answer="$(resolvectl query "$DOMAIN_PROBE" 2>/dev/null | head -1 | sed 's/^[^:]*: *//' || true)"
if [[ "$answer" == "127.0.0.1" ]]; then
  echo "    [ok]   systemd-resolved      probe.$DOMAIN -> 127.0.0.1"
else
  ok=0
  echo "    [FAIL] systemd-resolved      probe.$DOMAIN -> '${answer:-name not found}'"
  echo "           Ini gejala balapan NXDOMAIN dengan upstream publik tidak terdaftar."
fi

# 3) state link harus PERSIS seperti yang diharapkan dispatcher (127.0.0.1 saja).
#    Ini yang mencegah balapan NXDOMAIN dengan upstream publik.
if command -v resolvectl >/dev/null 2>&1 && [[ -n "${LINK:-}" ]]; then
  link_servers="$(resolvectl status "$LINK" | awk '/DNS Servers:/ {for (i=3;i<=NF;i++) if ($i ~ /^[0-9]/) print $i}' | sort -u | tr '\n' ' ' || true)"
  extra="$(echo "$link_servers" | tr ' ' '\n' | grep -v '^$' | grep -v '^127\.0\.0\.1$' | tr '\n' ' ' || true)"
  if [[ -n "${extra// /}" ]]; then
    ok=0
    echo "    [FAIL] $LINK masih punya DNS server lain: $extra"
    echo "           Perbaiki: resolvectl dns $LINK 127.0.0.1 && resolvectl flush-caches"
  else
    echo "    [ok]   $LINK DNS server = 127.0.0.1 saja"
  fi
fi

# 4) dispatcher terpasang & memenuhi syarat NetworkManager.
if [[ -f "$DISPATCHER" && -x "$DISPATCHER" ]]; then
  perms="$(stat -c '%U:%G %a' "$DISPATCHER" 2>/dev/null || true)"
  case "$perms" in
    root:root\ 7[0-5][0-5]) echo "    [ok]   persisten: dispatcher $DISPATCHER ($perms)" ;;
    *) ok=0; echo "    [FAIL] dispatcher permission $perms (harus root:root, 755)" ;;
  esac
else
  ok=0
  echo "    [FAIL] persisten: dispatcher $DISPATCHER tidak ada / tidak executable"
fi

# 5) guard: alamat loopback dnsmasq tidak boleh ikut jadi upstream (penyebab loop).
loop_upstream=0
for s in "${UPSTREAMS[@]}"; do
  if [[ "$s" == 127.* || "$s" == "0.0.0.0" ]]; then loop_upstream=1; fi
done
if [[ $loop_upstream -eq 1 ]]; then
  ok=0
  echo "    [FAIL] upstream berisi loopback (${UPSTREAMS[*]}) -> dnsmasq akan loop"
fi

echo
if [[ $ok -eq 1 ]]; then
  echo "✅ Selesai. Uji di browser:  https://<subdomain>.$DOMAIN/"
  echo "   Contoh:  curl -sI https://tenant-kopibutoni.$DOMAIN/"
else
  echo "⚠️  Ada langkah yang belum benar — lihat [FAIL] di atas."
  echo "    Jalankan ulang skrip ini setelah memperbaiki; script idempotent."
  exit 1
fi

cat <<'ROLLBACK'

--- Rollback bila perlu ---
  sudo systemctl stop dnsmasq && sudo systemctl disable dnsmasq
  sudo rm -f /etc/dnsmasq.d/rabasha-local.conf \
             /etc/NetworkManager/dispatcher.d/99-rabasha-local-dns
  sudo resolvectl revert <interface>     # buang override DNS runtime
  sudo resolvectl flush-caches
--------------------------
ROLLBACK
