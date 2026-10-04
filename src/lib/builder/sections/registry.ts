import type { SectionTypeDefinition, SectionType } from '../types';

export const SECTION_REGISTRY: Record<SectionType, SectionTypeDefinition> = {
  hero: {
    type: 'hero',
    name: 'Hero',
    icon: 'Layout',
    variants: [
      {
        id: 'hero-full',
        name: 'Full Width',
        description: 'Hero dengan background full width dan konten terpusat',
        defaultConfig: {
          headline: 'Selamat Datang di Toko Kami',
          subheadline: 'Produk berkualitas untuk kebutuhan Anda',
          cta_text: 'Belanja Sekarang',
          cta_link: '/produk',
          text_align: 'center',
        },
      },
      {
        id: 'hero-left',
        name: 'Left Aligned',
        description: 'Hero dengan teks di kiri dan gambar di kanan',
        defaultConfig: {
          headline: 'Kualitas Terbaik',
          subheadline: 'Temukan produk yang Anda butuhkan',
          cta_text: 'Lihat Produk',
          cta_link: '/produk',
          text_align: 'left',
        },
      },
      {
        id: 'hero-right',
        name: 'Right Aligned',
        description: 'Hero dengan gambar di kiri dan teks di kanan',
        defaultConfig: {
          headline: 'Pilihan Tepat',
          subheadline: 'Berbagai produk pilihan untuk Anda',
          cta_text: 'Mulai Belanja',
          cta_link: '/produk',
          text_align: 'right',
        },
      },
      {
        id: 'hero-bg-image',
        name: 'Background Image',
        description: 'Hero dengan background gambar dan overlay',
        defaultConfig: {
          headline: 'Promo Spesial',
          subheadline: 'Diskon hingga 50% untuk produk pilihan',
          cta_text: 'Lihat Promo',
          cta_link: '/promo',
          text_align: 'center',
        },
      },
    ],
  },
  features: {
    type: 'features',
    name: 'Features',
    icon: 'Grid',
    variants: [
      {
        id: 'features-3col',
        name: '3 Column Grid',
        description: 'Grid 3 kolom dengan icon dan deskripsi',
        defaultConfig: {
          title: 'Fitur Kami',
          items: [
            { icon: 'truck', title: 'Gratis Ongkir', description: 'Untuk pembelian di atas Rp 100.000' },
            { icon: 'shield', title: 'Pembayaran Aman', description: 'Transaksi terenkripsi dan aman' },
            { icon: 'refresh', title: 'Pengembalian', description: '30 hari uang kembali garansi' },
          ],
        },
      },
      {
        id: 'features-2col',
        name: '2 Column Grid',
        description: 'Grid 2 kolom dengan layout lebih lebar',
        defaultConfig: {
          title: 'Mengapa Pilih Kami',
          items: [
            { icon: 'star', title: 'Kualitas Premium', description: 'Produk berkualitas tinggi' },
            { icon: 'clock', title: 'Pengiriman Cepat', description: 'Same day delivery' },
          ],
        },
      },
      {
        id: 'features-list',
        name: 'List with Icons',
        description: 'List horizontal dengan icon di kiri',
        defaultConfig: {
          title: 'Keunggulan',
          items: [
            { icon: 'check', title: 'Produk Original', description: '100% produk original' },
            { icon: 'check', title: 'Harga Terjangkau', description: 'Harga kompetitif' },
            { icon: 'check', title: 'Pelayanan Ramah', description: 'Customer service 24/7' },
          ],
        },
      },
    ],
  },
  product_grid: {
    type: 'product_grid',
    name: 'Product Grid',
    icon: 'ShoppingBag',
    variants: [
      {
        id: 'product-4col',
        name: '4 Column',
        description: 'Grid produk 4 kolom',
        defaultConfig: {
          title: 'Produk Kami',
          columns: 4,
          show_price: true,
          show_rating: true,
        },
      },
      {
        id: 'product-3col',
        name: '3 Column',
        description: 'Grid produk 3 kolom',
        defaultConfig: {
          title: 'Produk Terlaris',
          columns: 3,
          show_price: true,
          show_rating: true,
        },
      },
      {
        id: 'product-2col',
        name: '2 Column',
        description: 'Grid produk 2 kolom dengan card lebih lebar',
        defaultConfig: {
          title: 'Produk Pilihan',
          columns: 2,
          show_price: true,
          show_rating: true,
        },
      },
    ],
  },
  testimonials: {
    type: 'testimonials',
    name: 'Testimonials',
    icon: 'Quote',
    variants: [
      {
        id: 'testimonials-grid',
        name: 'Grid',
        description: 'Grid testimonial dengan avatar dan rating',
        defaultConfig: {
          title: 'Apa Kata Mereka',
          items: [
            { name: 'Ibu Sari', text: 'Produk sangat berkualitas!', rating: 5 },
            { name: 'Bapak Joko', text: 'Pelayanan memuaskan', rating: 5 },
            { name: 'Ibu Rina', text: 'Pengiriman cepat', rating: 4 },
          ],
        },
      },
      {
        id: 'testimonials-carousel',
        name: 'Carousel',
        description: 'Carousel testimonial dengan navigasi',
        defaultConfig: {
          title: 'Review Pelanggan',
          items: [
            { name: 'Andi', text: 'Sangat recommended!', rating: 5 },
            { name: 'Budi', text: 'Harga terjangkau', rating: 4 },
          ],
        },
      },
      {
        id: 'testimonials-single',
        name: 'Single Quote',
        description: 'Testimonial tunggal dengan quote besar',
        defaultConfig: {
          title: '',
          items: [
            { name: 'Pelanggan Setia', text: 'Ini adalah toko terbaik yang pernah saya temukan!', rating: 5 },
          ],
        },
      },
    ],
  },
  faq: {
    type: 'faq',
    name: 'FAQ',
    icon: 'HelpCircle',
    variants: [
      {
        id: 'faq-accordion',
        name: 'Accordion',
        description: 'FAQ dengan accordion expand/collapse',
        defaultConfig: {
          title: 'Pertanyaan Umum',
          items: [
            { question: 'Bagaimana cara memesan?', answer: 'Pilih produk, lalu checkout' },
            { question: 'Apa saja metode pembayaran?', answer: 'Transfer bank, e-wallet, COD' },
          ],
        },
      },
      {
        id: 'faq-list',
        name: 'List',
        description: 'FAQ sebagai list dengan jawaban selalu terlihat',
        defaultConfig: {
          title: 'FAQ',
          items: [
            { question: 'Berapa lama pengiriman?', answer: '1-3 hari kerja' },
            { question: 'Apakah bisa retur?', answer: 'Bisa, maksimal 7 hari' },
          ],
        },
      },
      {
        id: 'faq-grid',
        name: 'Grid',
        description: 'FAQ dalam bentuk grid 2 kolom',
        defaultConfig: {
          title: 'Tanya Jawab',
          items: [
            { question: 'Minimum pembelian?', answer: 'Tidak ada minimum' },
            { question: 'Jam operasional?', answer: '09:00 - 21:00' },
          ],
        },
      },
    ],
  },
  cta: {
    type: 'cta',
    name: 'CTA',
    icon: 'Megaphone',
    variants: [
      {
        id: 'cta-banner',
        name: 'Full Width Banner',
        description: 'Banner CTA full width dengan background berwarna',
        defaultConfig: {
          title: 'Siap Memulai?',
          subtitle: 'Hubungi kami untuk penawaran spesial',
          button_text: 'Hubungi Kami',
          button_link: '/kontak',
        },
      },
      {
        id: 'cta-card',
        name: 'Centered Card',
        description: 'Card CTA terpusat dengan shadow',
        defaultConfig: {
          title: 'Dapatkan Diskon 20%',
          subtitle: 'Daftar sekarang dan dapatkan voucher',
          button_text: 'Daftar',
          button_link: '/daftar',
        },
      },
      {
        id: 'cta-split',
        name: 'Split',
        description: 'Layout split dengan teks di kiri dan tombol di kanan',
        defaultConfig: {
          title: 'Butuh Bantuan?',
          subtitle: 'Tim kami siap membantu Anda',
          button_text: 'Chat WhatsApp',
          button_link: '/wa',
        },
      },
    ],
  },
  contact: {
    type: 'contact',
    name: 'Contact',
    icon: 'Mail',
    variants: [
      {
        id: 'contact-form',
        name: 'Form Only',
        description: 'Form kontak tanpa map',
        defaultConfig: {
          title: 'Hubungi Kami',
          subtitle: 'Kirim pesan dan kami akan segera merespons',
          show_map: false,
        },
      },
      {
        id: 'contact-form-map',
        name: 'Form + Map',
        description: 'Form kontak dengan Google Maps',
        defaultConfig: {
          title: 'Kontak',
          subtitle: 'Kunjungi toko kami atau kirim pesan',
          show_map: true,
          address: 'Jakarta, Indonesia',
        },
      },
      {
        id: 'contact-split',
        name: 'Split',
        description: 'Layout split dengan info kontak dan form',
        defaultConfig: {
          title: 'Get in Touch',
          subtitle: 'Kami senang mendengar dari Anda',
          show_map: false,
        },
      },
    ],
  },
  about: {
    type: 'about',
    name: 'About',
    icon: 'Info',
    variants: [
      {
        id: 'about-left',
        name: 'Image Left',
        description: 'Gambar di kiri, teks di kanan',
        defaultConfig: {
          title: 'Tentang Kami',
          content: 'Kami adalah toko online yang menyediakan produk berkualitas.',
          image: '',
        },
      },
      {
        id: 'about-right',
        name: 'Image Right',
        description: 'Teks di kiri, gambar di kanan',
        defaultConfig: {
          title: 'Cerita Kami',
          content: 'Berawal dari toko kecil hingga menjadi toko online terpercaya.',
          image: '',
        },
      },
      {
        id: 'about-centered',
        name: 'Centered',
        description: 'Layout terpusat dengan gambar di atas',
        defaultConfig: {
          title: 'Tentang Kami',
          content: 'Dedikasi kami adalah memberikan yang terbaik untuk pelanggan.',
          image: '',
        },
      },
    ],
  },
  gallery: {
    type: 'gallery',
    name: 'Gallery',
    icon: 'Image',
    variants: [
      {
        id: 'gallery-grid',
        name: 'Grid',
        description: 'Grid gambar dengan ukuran sama',
        defaultConfig: {
          title: 'Galeri',
          images: [],
        },
      },
      {
        id: 'gallery-masonry',
        name: 'Masonry',
        description: 'Layout masonry dengan ukuran bervariasi',
        defaultConfig: {
          title: 'Galeri Foto',
          images: [],
        },
      },
      {
        id: 'gallery-carousel',
        name: 'Carousel',
        description: 'Carousel gambar dengan navigasi',
        defaultConfig: {
          title: 'Galeri',
          images: [],
        },
      },
    ],
  },
  video: {
    type: 'video',
    name: 'Video',
    icon: 'Play',
    variants: [
      {
        id: 'video-full',
        name: 'Full Width',
        description: 'Video full width dengan aspect ratio 16:9',
        defaultConfig: {
          title: 'Video Kami',
          url: '',
        },
      },
      {
        id: 'video-centered',
        name: 'Centered',
        description: 'Video terpusat dengan max-width',
        defaultConfig: {
          title: 'Tonton Video',
          url: '',
        },
      },
      {
        id: 'video-bg',
        name: 'Background',
        description: 'Video sebagai background section',
        defaultConfig: {
          title: '',
          url: '',
        },
      },
    ],
  },
  team: {
    type: 'team',
    name: 'Team',
    icon: 'Users',
    variants: [
      {
        id: 'team-grid',
        name: 'Grid',
        description: 'Grid foto tim dengan nama dan role',
        defaultConfig: {
          title: 'Tim Kami',
          members: [
            { name: 'John Doe', role: 'Founder', image: '' },
            { name: 'Jane Doe', role: 'Co-Founder', image: '' },
          ],
        },
      },
      {
        id: 'team-list',
        name: 'List',
        description: 'List horizontal dengan foto di kiri',
        defaultConfig: {
          title: 'Kepemimpinan',
          members: [
            { name: 'John Doe', role: 'CEO', image: '' },
          ],
        },
      },
      {
        id: 'team-carousel',
        name: 'Carousel',
        description: 'Carousel foto tim',
        defaultConfig: {
          title: 'Tim',
          members: [
            { name: 'John', role: 'Founder', image: '' },
            { name: 'Jane', role: 'Designer', image: '' },
          ],
        },
      },
    ],
  },
  pricing: {
    type: 'pricing',
    name: 'Pricing',
    icon: 'DollarSign',
    variants: [
      {
        id: 'pricing-3tier',
        name: '3 Tier',
        description: 'Tabel harga 3 paket',
        defaultConfig: {
          title: 'Paket Harga',
          items: [
            { name: 'Basic', price: 'Rp 99.000', features: ['Fitur 1', 'Fitur 2'] },
            { name: 'Pro', price: 'Rp 199.000', features: ['Fitur 1', 'Fitur 2', 'Fitur 3'] },
            { name: 'Premium', price: 'Rp 399.000', features: ['Semua fitur'] },
          ],
        },
      },
      {
        id: 'pricing-2tier',
        name: '2 Tier',
        description: 'Tabel harga 2 paket',
        defaultConfig: {
          title: 'Harga',
          items: [
            { name: 'Standar', price: 'Rp 149.000', features: ['Fitur dasar'] },
            { name: 'Premium', price: 'Rp 299.000', features: ['Semua fitur'] },
          ],
        },
      },
      {
        id: 'pricing-single',
        name: 'Single',
        description: 'Harga single product',
        defaultConfig: {
          title: 'Harga Spesial',
          items: [
            { name: 'Paket Hemat', price: 'Rp 199.000', features: ['Semua fitur'] },
          ],
        },
      },
    ],
  },
  newsletter: {
    type: 'newsletter',
    name: 'Newsletter',
    icon: 'Send',
    variants: [
      {
        id: 'newsletter-inline',
        name: 'Inline',
        description: 'Form newsletter inline dengan input dan tombol',
        defaultConfig: {
          title: 'Berlangganan Newsletter',
          subtitle: 'Dapatkan info promo terbaru',
          placeholder: 'Email Anda',
          button_text: 'Berlangganan',
        },
      },
      {
        id: 'newsletter-card',
        name: 'Card',
        description: 'Card newsletter dengan background berwarna',
        defaultConfig: {
          title: 'Jangan Lewatkan Promo!',
          subtitle: 'Daftar sekarang dan dapatkan diskon 10%',
          placeholder: 'Masukkan email',
          button_text: 'Daftar',
        },
      },
      {
        id: 'newsletter-split',
        name: 'Split',
        description: 'Layout split dengan teks di kiri dan form di kanan',
        defaultConfig: {
          title: 'Stay Updated',
          subtitle: 'Dapatkan update terbaru dari kami',
          placeholder: 'Email',
          button_text: 'Subscribe',
        },
      },
    ],
  },
  divider: {
    type: 'divider',
    name: 'Divider',
    icon: 'Minus',
    variants: [
      {
        id: 'divider-line',
        name: 'Line',
        description: 'Garis pemisah tipis',
        defaultConfig: {
          style: 'solid',
          color: '#e5e7eb',
        },
      },
      {
        id: 'divider-spacer',
        name: 'Spacer',
        description: 'Ruang kosong sebagai pemisah',
        defaultConfig: {
          height: 80,
        },
      },
      {
        id: 'divider-image',
        name: 'Image',
        description: 'Gambar sebagai pemisah section',
        defaultConfig: {
          image: '',
        },
      },
    ],
  },
  marquee: {
    type: 'marquee',
    name: 'Teks Berjalan',
    icon: 'MoveHorizontal',
    variants: [
      {
        id: 'marquee-band',
        name: 'Pita Teks',
        description: 'Pita teks berjalan untuk promo dan info toko',
        defaultStyle: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
        defaultConfig: {
          items: ['Promo Spesial', 'Gratis Konsultasi', 'Buka Setiap Hari', 'Pesan via WhatsApp'],
        },
      },
    ],
  },
  menu_board: {
    type: 'menu_board',
    name: 'Menu / Harga',
    icon: 'Coffee',
    variants: [
      {
        id: 'menu-tabs',
        name: 'Tab Kategori',
        description: 'Daftar harga bertab per kategori dengan garis titik-titik',
        defaultStyle: { padding: { top: 64, right: 24, bottom: 64, left: 24 } },
        defaultConfig: {
          title: 'Daftar Harga',
          subtitle: 'Pilih kategori untuk melihat harga.',
          groups: [
            {
              key: 'kategori-1',
              label: 'Kategori 1',
              items: [
                { name: 'Item Contoh 1', desc: 'Deskripsi singkat item', price: 'Rp 25rb' },
                { name: 'Item Contoh 2', desc: 'Deskripsi singkat item', price: 'Rp 40rb' },
              ],
            },
            {
              key: 'kategori-2',
              label: 'Kategori 2',
              items: [
                { name: 'Item Contoh 3', desc: 'Deskripsi singkat item', price: 'Rp 30rb' },
              ],
            },
          ],
        },
      },
      {
        id: 'menu-list',
        name: 'Daftar Tunggal',
        description: 'Daftar harga tunggal tanpa tab',
        defaultStyle: { padding: { top: 64, right: 24, bottom: 64, left: 24 } },
        defaultConfig: {
          title: 'Daftar Harga',
          subtitle: '',
          items: [
            { name: 'Item Contoh 1', desc: 'Deskripsi singkat item', price: 'Rp 25rb' },
            { name: 'Item Contoh 2', desc: 'Deskripsi singkat item', price: 'Rp 40rb' },
          ],
        },
      },
    ],
  },
  steps: {
    type: 'steps',
    name: 'Langkah Proses',
    icon: 'ListOrdered',
    variants: [
      {
        id: 'steps-3col',
        name: '3 Langkah',
        description: 'Tiga langkah bernomor dalam 3 kolom',
        defaultStyle: { padding: { top: 64, right: 24, bottom: 64, left: 24 } },
        defaultConfig: {
          title: 'Cara Pesan',
          subtitle: 'Tiga langkah mudah untuk memesan.',
          items: [
            { title: 'Pilih layanan', description: 'Tentukan layanan atau produk yang Anda butuhkan.' },
            { title: 'Isi form', description: 'Lengkapi nama, kontak, dan jadwal yang diinginkan.' },
            { title: 'Konfirmasi', description: 'Kami konfirmasi via WhatsApp. Selesai!' },
          ],
        },
      },
    ],
  },
  location: {
    type: 'location',
    name: 'Lokasi & Jam',
    icon: 'MapPin',
    variants: [
      {
        id: 'location-hours',
        name: 'Kunjungi Kami',
        description: 'Alamat + jam buka + tombol WhatsApp',
        defaultStyle: { padding: { top: 64, right: 24, bottom: 64, left: 24 } },
        defaultConfig: {
          title: 'Kunjungi Kami',
          address: 'Jl. Contoh No. 17, ganti dengan alamat toko Anda.',
          note: 'Mudah dijangkau, parkir luas.',
          button_text: 'Chat via WhatsApp',
          button_link: 'https://wa.me/6281234567890',
          hours: [
            { days: 'Senin–Sabtu', time: '09.00–20.00' },
            { days: 'Minggu', time: 'Tutup' },
          ],
        },
      },
    ],
  },
};

export function getSectionType(type: SectionType): SectionTypeDefinition | undefined {
  return SECTION_REGISTRY[type];
}

export function getSectionVariant(type: SectionType, variantId: string) {
  return SECTION_REGISTRY[type]?.variants.find((v) => v.id === variantId);
}
