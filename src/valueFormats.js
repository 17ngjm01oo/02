// Generated from src/valueFormats.json by scripts/generate-value-formats-module.py.
export const compactMagnitudePrecision = {
  "maximumFractionDigits": 2,
  "significantDigitBudget": 4
};

export const valueFormats = {
  "billionsMagnitude": {
    "valueScaleMode": "billionsMagnitude"
  },
  "percentOneDecimal": {
    "valueScaleMode": "percentOneDecimal",
    "suffix": "%",
    "suffixSpacing": "",
    "maximumFractionDigits": 1,
    "integerValueThreshold": 1000
  },
  "decimalOne": {
    "maximumFractionDigits": 1
  },
  "populationDensity": {
    "maximumFractionDigits": 1,
    "integerValueThreshold": 1000
  },
  "decimalTwo": {
    "maximumFractionDigits": 2
  },
  "decimalThree": {
    "maximumFractionDigits": 3
  },
  "peopleCountMagnitude": {
    "valueScaleMode": "unitsMagnitude",
    "compactIntegerValueThreshold": 100
  },
  "millionsMagnitude": {
    "valueScaleMode": "millionsMagnitude"
  },
  "unitsMagnitude": {
    "valueScaleMode": "unitsMagnitude"
  },
  "areaMagnitude": {
    "valueScaleMode": "unitsMagnitude",
    "fallbackPrecisionMode": "compact"
  },
  "co2Emissions": {
    "valueScaleMode": "unitsMagnitude",
    "fallbackPrecisionMode": "compact",
    "lowerUnitThreshold": 1,
    "lowerUnitValueScale": 1000,
    "lowerUnitSuffix": "kt",
    "suffix": "Mt"
  },
  "co2EmissionsPerCapita": {
    "suffix": "t",
    "maximumFractionDigits": 2
  }
};

export const rawMagnitudeStepsByFormat = {
  "english": [
    {
      "threshold": 1000000000000000,
      "valueScale": 1e-15,
      "compactUnit": "Q"
    },
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": "T"
    },
    {
      "threshold": 1000000000,
      "valueScale": 1e-09,
      "compactUnit": "B"
    },
    {
      "threshold": 1000000,
      "valueScale": 1e-06,
      "compactUnit": "M"
    }
  ],
  "japanese": [
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": "兆"
    },
    {
      "threshold": 100000000,
      "valueScale": 1e-08,
      "compactUnit": "億"
    },
    {
      "threshold": 10000,
      "valueScale": 0.0001,
      "compactUnit": "万"
    }
  ],
  "spanish": [
    {
      "threshold": 1000000000000000,
      "valueScale": 1e-15,
      "compactUnit": " mil B"
    },
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": " B"
    },
    {
      "threshold": 1000000000,
      "valueScale": 1e-09,
      "compactUnit": " mil M"
    },
    {
      "threshold": 1000000,
      "valueScale": 1e-06,
      "compactUnit": " M"
    }
  ],
  "french": [
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": " Bn"
    },
    {
      "threshold": 1000000000,
      "valueScale": 1e-09,
      "compactUnit": " Md"
    },
    {
      "threshold": 1000000,
      "valueScale": 1e-06,
      "compactUnit": " M"
    }
  ],
  "brazilian_portuguese": [
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": " tri"
    },
    {
      "threshold": 1000000000,
      "valueScale": 1e-09,
      "compactUnit": " bi"
    },
    {
      "threshold": 1000000,
      "valueScale": 1e-06,
      "compactUnit": " mi"
    }
  ],
  "german": [
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": " Bio."
    },
    {
      "threshold": 1000000000,
      "valueScale": 1e-09,
      "compactUnit": " Mrd."
    },
    {
      "threshold": 1000000,
      "valueScale": 1e-06,
      "compactUnit": " Mio."
    }
  ],
  "italian": [
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": " Bln"
    },
    {
      "threshold": 1000000000,
      "valueScale": 1e-09,
      "compactUnit": " Mld"
    },
    {
      "threshold": 1000000,
      "valueScale": 1e-06,
      "compactUnit": " Mln"
    }
  ],
  "korean": [
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": "조"
    },
    {
      "threshold": 100000000,
      "valueScale": 1e-08,
      "compactUnit": "억"
    },
    {
      "threshold": 10000,
      "valueScale": 0.0001,
      "compactUnit": "만"
    }
  ],
  "turkish": [
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": " Tn"
    },
    {
      "threshold": 1000000000,
      "valueScale": 1e-09,
      "compactUnit": " Mr"
    },
    {
      "threshold": 1000000,
      "valueScale": 1e-06,
      "compactUnit": " Mn"
    }
  ],
  "indonesian": [
    {
      "threshold": 1000000000000,
      "valueScale": 1e-12,
      "compactUnit": " T"
    },
    {
      "threshold": 1000000000,
      "valueScale": 1e-09,
      "compactUnit": " M"
    },
    {
      "threshold": 1000000,
      "valueScale": 1e-06,
      "compactUnit": " jt"
    }
  ]
};

export const magnitudeInputs = {
  "billions": {
    "rawValueScale": 1000000000,
    "forceMinimumCompactUnit": true
  },
  "millions": {
    "rawValueScale": 1000000,
    "forceMinimumCompactUnit": true
  },
  "units": {
    "rawValueScale": 1
  }
};
