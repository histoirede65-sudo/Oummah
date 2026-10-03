export type VerifiedHealthSource = {
  title: string;
  publisher: string;
  url: string;
  checkedAt: string;
  sourceType: 'exact_barcode_product_page';
};

export type VerifiedProductHealthData = {
  barcode: string;
  ingredientsText?: string;
  ingredientsTextFr?: string;
  additives: Array<{ code: string; name: string }>;
  otherFoodComponents?: Array<{ type: 'flavoring'; name: string }>;
  nutritionBasis?: '100 ml' | '100 g';
  nutritionValuesVerified?: {
    energyKcal?: number;
    sugarsG?: number;
    saltG?: number;
    saturatedFatG?: number;
    proteinsG?: number;
    fiberG?: number;
  };
  novaGroup?: number;
  sources: VerifiedHealthSource[];
  confidence: 'high';
  reviewedAt: string;
  schemaVersion: 1;
};

const VERIFIED_PRODUCT_HEALTH_DATA: Record<string, VerifiedProductHealthData> = {
  '5000112680171': {
    barcode: '5000112680171',
    ingredientsText: 'Woda, cukier, dwutlenek węgla, barwnik E 150d, kwas: kwas fosforowy, naturalne aromaty, aromat kofeina.',
    ingredientsTextFr: 'Eau, sucre, dioxyde de carbone, colorant : E150d, acide : acide phosphorique, arômes naturels, arôme caféine.',
    additives: [
      { code: 'E150D', name: 'Caramel au sulfite d’ammonium' },
      { code: 'E338', name: 'Acide phosphorique' },
    ],
    otherFoodComponents: [
      { type: 'flavoring', name: 'Arômes naturels' },
      { type: 'flavoring', name: 'Arôme caféine' },
    ],
    nutritionBasis: '100 ml',
    nutritionValuesVerified: {
      energyKcal: 42,
      sugarsG: 10.6,
      saltG: 0,
      saturatedFatG: 0,
      proteinsG: 0,
    },
    sources: [
      {
        title: 'Coca-Cola Original Taste 500 ml',
        publisher: 'DeliGro',
        url: 'https://deligro.pl/napoje/gazowane/inne/original-taste-500-ml-coca-cola-397',
        checkedAt: '2026-09-30',
        sourceType: 'exact_barcode_product_page',
      },
      {
        title: 'Napój gazowany o smaku cola Coca-Cola 500 ml',
        publisher: 'Auchan Poland',
        url: 'https://zakupy.auchan.pl/products/nap%C3%B3j-gazowany-o-smaku-cola-coca-cola-500-ml/00633669',
        checkedAt: '2026-09-30',
        sourceType: 'exact_barcode_product_page',
      },
    ],
    confidence: 'high',
    reviewedAt: '2026-09-30',
    schemaVersion: 1,
  },
};

export function getVerifiedProductHealthData(barcode: string) {
  return VERIFIED_PRODUCT_HEALTH_DATA[barcode.replace(/\D/g, '')];
}
