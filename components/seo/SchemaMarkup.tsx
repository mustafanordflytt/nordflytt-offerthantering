'use client';

import { usePathname } from 'next/navigation';

interface SchemaMarkupProps {
  type?: 'Organization' | 'LocalBusiness' | 'Service' | 'FAQPage' | 'BreadcrumbList';
  customData?: any;
}

export default function SchemaMarkup({ type = 'Organization', customData }: SchemaMarkupProps) {
  const pathname = usePathname();

  // Organization Schema (for homepage)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "MovingCompany",
    "name": "Nordflytt",
    "description": "Professionell flyttfirma i Stockholm med AI-driven prissättning och planering. Fast pris, försäkrat, RUT-avdrag.",
    "url": "https://nordflytt.se",
    "logo": "https://nordflytt.se/nordflytt-logo.svg",
    "image": "https://nordflytt.se/nordflytt-hero.jpg",
    "telephone": "+46 8 123 456 78",
    "email": "info@nordflytt.se",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Vasagatan 10",
      "addressLocality": "Stockholm",
      "postalCode": "111 20",
      "addressCountry": "SE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 59.3293,
      "longitude": 18.0686
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "16:00"
      }
    ],
    "priceRange": "$$",
    "sameAs": [
      "https://www.facebook.com/nordflytt",
      "https://www.instagram.com/nordflytt",
      "https://www.linkedin.com/company/nordflytt"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "324",
      "bestRating": "5"
    },
    "areaServed": {
      "@type": "City",
      "name": "Stockholm",
      "containedInPlace": {
        "@type": "Country",
        "name": "Sweden"
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Flyttjänster",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Privatflytt",
            "description": "Professionell privatflytt med AI-optimerad planering"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Kontorsflytt",
            "description": "Effektiv kontorsflytt med minimal störning"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Flyttstädning",
            "description": "Professionell flyttstädning med garanti"
          }
        }
      ]
    }
  };

  // Service Schema (for service pages)
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": customData?.serviceName || "Flyttjänst",
    "provider": {
      "@type": "MovingCompany",
      "name": "Nordflytt",
      "url": "https://nordflytt.se"
    },
    "areaServed": {
      "@type": "City",
      "name": "Stockholm"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": customData?.serviceName || "Flyttjänst",
      "itemListElement": [
        {
          "@type": "Offer",
          "price": customData?.price || "Från 800 kr/timme",
          "priceCurrency": "SEK",
          "eligibleRegion": {
            "@type": "Place",
            "name": "Stockholm"
          },
          "availability": "https://schema.org/InStock"
        }
      ]
    }
  };

  // FAQ Schema (for FAQ pages)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": customData?.faqs?.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    })) || [
      {
        "@type": "Question",
        "name": "Hur fungerar AI-driven prissättning?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vår AI analyserar hundratals faktorer som volym, avstånd, tillgänglighet och historisk data för att ge dig det mest exakta priset. Detta betyder att du får ett rättvist pris baserat på dina specifika behov."
        }
      },
      {
        "@type": "Question",
        "name": "Vad ingår i RUT-avdraget?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "RUT-avdraget täcker 50% av arbetskostnaden vid flytt, upp till 50 000 kr per person och år. Detta inkluderar packning, lastning, transport och uppackning."
        }
      }
    ]
  };

  // Breadcrumb Schema
  const generateBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Hem",
        "item": "https://nordflytt.se"
      }
    ];

    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      const name = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ');
      breadcrumbs.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": name,
        "item": `https://nordflytt.se${currentPath}`
      });
    });

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs
    };
  };

  // Local Business Schema (for area pages)
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Nordflytt ${customData?.area || 'Stockholm'}`,
    "image": "https://nordflytt.se/nordflytt-hero.jpg",
    "@id": `https://nordflytt.se/omraden/${customData?.areaSlug || 'stockholm'}`,
    "url": `https://nordflytt.se/omraden/${customData?.areaSlug || 'stockholm'}`,
    "telephone": "+46 8 123 456 78",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Vasagatan 10",
      "addressLocality": customData?.area || "Stockholm",
      "postalCode": "111 20",
      "addressCountry": "SE"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      }
    ],
    "priceRange": "$$"
  };

  // Determine which schema to use based on page type
  let schemaData;
  switch (type) {
    case 'Service':
      schemaData = serviceSchema;
      break;
    case 'FAQPage':
      schemaData = faqSchema;
      break;
    case 'BreadcrumbList':
      schemaData = generateBreadcrumbs();
      break;
    case 'LocalBusiness':
      schemaData = localBusinessSchema;
      break;
    default:
      schemaData = organizationSchema;
  }

  // Merge with custom data if provided
  if (customData && type !== 'BreadcrumbList') {
    schemaData = { ...schemaData, ...customData };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* Always include breadcrumbs except on homepage */}
      {pathname !== '/' && type !== 'BreadcrumbList' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbs()) }}
        />
      )}
    </>
  );
}