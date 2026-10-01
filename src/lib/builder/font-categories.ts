export interface FontCategory {
  id: string;
  name: string;
  fonts: string[];
}

export const FONT_CATEGORIES: FontCategory[] = [
  {
    id: 'modern',
    name: 'Modern',
    fonts: [
      'Inter',
      'Plus Jakarta Sans',
      'Manrope',
      'DM Sans',
      'Outfit',
      'Poppins',
      'Montserrat',
      'Space Grotesk',
      'Figtree',
      'Nunito Sans',
      'Roboto',
      'Open Sans',
      'Lato',
      'Work Sans',
      'Source Sans 3',
      'IBM Plex Sans',
      'Public Sans',
      'Rubik',
      'Raleway',
      'Mulish',
      'Barlow',
      'Archivo',
    ],
  },
  {
    id: 'tech',
    name: 'Tech',
    fonts: [
      'Space Mono',
      'JetBrains Mono',
      'IBM Plex Mono',
      'Roboto Mono',
      'DM Mono',
      'Oxanium',
      'Orbitron',
      'Exo 2',
      'Rajdhani',
    ],
  },
  {
    id: 'luxury',
    name: 'Luxury / Elegant',
    fonts: [
      'Playfair Display',
      'Cormorant Garamond',
      'DM Serif Display',
      'Lora',
      'Libre Baskerville',
      'Bodoni Moda',
      'Prata',
      'Cinzel',
      'Italiana',
    ],
  },
  {
    id: 'creative',
    name: 'Creative',
    fonts: [
      'Syne',
      'Bricolage Grotesque',
      'Unbounded',
      'Bebas Neue',
      'Abril Fatface',
      'Righteous',
      'Josefin Sans',
    ],
  },
  {
    id: 'handwritten',
    name: 'Handwritten',
    fonts: [
      'Caveat',
      'Pacifico',
      'Dancing Script',
      'Great Vibes',
      'Satisfy',
      'Sacramento',
      'Patrick Hand',
      'Kalam',
      'Permanent Marker',
    ],
  },
];

export function getGoogleFontsUrl(fonts: string[]): string {
  const family = fonts
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${family}&display=swap`;
}
