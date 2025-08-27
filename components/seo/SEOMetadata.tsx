import { Metadata } from 'next';

interface SEOMetadataProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  canonicalUrl?: string;
  noindex?: boolean;
  structuredData?: any;
}

// SEO-optimized metadata generator
export function generateSEOMetadata({
  title = 'Nordflytt - AI-driven Flyttfirma Stockholm | Fast Pris & RUT-avdrag',
  description = 'Professionell flyttfirma i Stockholm med AI-optimerad prissättning. ✓ Fast pris på 30 sekunder ✓ Försäkrat ✓ RUT-avdrag 50% ✓ 4.8 i betyg. Boka idag!',
  keywords = ['flyttfirma stockholm', 'AI flyttplanering', 'flytthjälp', 'RUT-avdrag flytt', 'smart prissättning flytt'],
  ogImage = 'https://nordflytt.se/og-image.jpg',
  ogType = 'website',
  canonicalUrl,
  noindex = false,
  structuredData
}: SEOMetadataProps): Metadata {
  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Nordflytt', url: 'https://nordflytt.se' }],
    creator: 'Nordflytt',
    publisher: 'Nordflytt',
    formatDetection: {
      telephone: true,
      email: true,
      address: true,
    },
    metadataBase: new URL('https://nordflytt.se'),
    alternates: {
      canonical: canonicalUrl || 'https://nordflytt.se',
    },
    openGraph: {
      title: title.length > 60 ? title.substring(0, 57) + '...' : title,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      url: canonicalUrl || 'https://nordflytt.se',
      siteName: 'Nordflytt',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Nordflytt - Professionell flyttfirma med AI-teknologi',
        },
      ],
      locale: 'sv_SE',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: title.length > 70 ? title.substring(0, 67) + '...' : title,
      description: description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [ogImage],
      creator: '@nordflytt',
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
    },
  };

  return metadata;
}

// Pre-configured metadata for common pages
export const pageMetadata = {
  home: generateSEOMetadata({
    title: 'Nordflytt - AI-driven Flyttfirma Stockholm | Fast Pris & RUT-avdrag',
    description: 'Sveriges första AI-drivna flyttfirma. Få fast pris på 30 sekunder med vår smarta priskalkylator. ✓ Försäkrat ✓ RUT-avdrag 50% ✓ 4.8 i betyg',
    keywords: ['flyttfirma stockholm', 'AI flyttplanering', 'smart flyttfirma', 'billig flyttfirma', 'flytthjälp stockholm'],
  }),
  
  privatflytt: generateSEOMetadata({
    title: 'Privatflytt Stockholm - AI-optimerad & Fast Pris | Nordflytt',
    description: 'Privatflytt i Stockholm med AI-driven planering för snabbaste flytten. Fast pris direkt, RUT-avdrag 50%. Boka gratis värdering!',
    keywords: ['privatflytt stockholm', 'bohagsflytt', 'flytthjälp privat', 'billig privatflytt'],
  }),
  
  kontorsflytt: generateSEOMetadata({
    title: 'Kontorsflytt Stockholm - Minimal Störning & Fast Pris | Nordflytt',
    description: 'Professionell kontorsflytt i Stockholm. AI-optimerad planering minimerar driftstopp. Fast pris, försäkrat, helgflytt möjlig.',
    keywords: ['kontorsflytt stockholm', 'företagsflytt', 'kontor flytta', 'affärsflytt stockholm'],
  }),
  
  flyttstadning: generateSEOMetadata({
    title: 'Flyttstädning Stockholm - Garanti & RUT-avdrag 50% | Nordflytt',
    description: 'Professionell flyttstädning i Stockholm med besiktningsgaranti. RUT-avdrag 50% på arbetskostnaden. Boka enkelt online!',
    keywords: ['flyttstädning stockholm', 'flyttstäd', 'städning flytt', 'RUT städning'],
  }),
  
  priser: generateSEOMetadata({
    title: 'Flyttpriser Stockholm 2024 - Transparent Prissättning | Nordflytt',
    description: 'Se våra flyttpriser för Stockholm. AI-driven prissättning ger dig alltid rätt pris. Från 800 kr/tim efter RUT. Få offert på 30 sekunder!',
    keywords: ['flyttpriser', 'flytta pris', 'kostnad flytt stockholm', 'billig flyttfirma priser'],
  }),
  
  aiPlanering: generateSEOMetadata({
    title: 'AI Flyttplanering - 70% Snabbare Flytt | Nordflytt Innovation',
    description: 'Upplev framtidens flytt med AI-driven planering. Optimerade rutter, smart packning, exakt tidsestimering. Första i Sverige!',
    keywords: ['AI flyttplanering', 'smart flytt', 'flyttinnovation', 'digital flyttfirma'],
  }),
};

// Area-specific metadata generator
export function generateAreaMetadata(area: string, areaSlug: string): Metadata {
  return generateSEOMetadata({
    title: `Flyttfirma ${area} - Lokal Expertis & Fast Pris | Nordflytt`,
    description: `Professionell flyttfirma i ${area}. Vi känner området och ger dig snabbaste flytten. AI-optimerad rutt, RUT-avdrag, fast pris direkt!`,
    keywords: [`flyttfirma ${area.toLowerCase()}`, `flytta ${area.toLowerCase()}`, `flytthjälp ${area.toLowerCase()}`, 'lokal flyttfirma'],
    canonicalUrl: `https://nordflytt.se/omraden/${areaSlug}`,
  });
}

// Service + Area combination metadata
export function generateServiceAreaMetadata(service: string, area: string): Metadata {
  const serviceNames: Record<string, string> = {
    privatflytt: 'Privatflytt',
    kontorsflytt: 'Kontorsflytt',
    flyttstadning: 'Flyttstädning',
  };
  
  const serviceName = serviceNames[service] || service;
  
  return generateSEOMetadata({
    title: `${serviceName} ${area} - Professionell & AI-optimerad | Nordflytt`,
    description: `${serviceName} i ${area} med Nordflytt. AI-driven planering, fast pris på 30 sek, RUT-avdrag. Lokalkännedom ger snabbaste flytten!`,
    keywords: [`${service} ${area.toLowerCase()}`, `${serviceName.toLowerCase()} ${area.toLowerCase()}`, 'flyttfirma', 'flytthjälp'],
    canonicalUrl: `https://nordflytt.se/${service}-${area.toLowerCase().replace(' ', '-')}`,
  });
}