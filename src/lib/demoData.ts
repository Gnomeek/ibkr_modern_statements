// src/lib/demoData.ts
// 演示用虚构数据，与任何真实账户无关
import type { MergedStatementData } from '../types/statement'

export function buildDemoData(): MergedStatementData {
  const periodStart = new Date('2025-01-01')
  const periodEnd   = new Date('2025-12-31')

  return {
    periodStart,
    periodEnd,
    accountName: 'Demo Account',
    accountId: 'UDEMO01',
    baseCurrency: 'USD',

    currentNav: 142680,
    twr: 0.1843,
    cashBalance: 4230,
    startingNav: 95000,
    depositsWithdrawals: 20000,
    endingNav: 142680,

    hasOverlap: false,
    fileCount: 1,

    openPositions: [
      { symbol: 'NVDA',  quantity: 50,  costPrice: 480.00, costBasis: 24000, closePrice: 875.20, marketValue: 43760, unrealizedPL: 19760 },
      { symbol: 'AAPL',  quantity: 80,  costPrice: 178.50, costBasis: 14280, closePrice: 225.80, marketValue: 18064, unrealizedPL: 3784  },
      { symbol: 'MSFT',  quantity: 40,  costPrice: 370.00, costBasis: 14800, closePrice: 415.60, marketValue: 16624, unrealizedPL: 1824  },
      { symbol: 'GOOGL', quantity: 30,  costPrice: 140.00, costBasis: 4200,  closePrice: 172.40, marketValue: 5172,  unrealizedPL: 972   },
      { symbol: 'AMZN',  quantity: 25,  costPrice: 178.00, costBasis: 4450,  closePrice: 196.30, marketValue: 4907,  unrealizedPL: 457   },
      { symbol: 'META',  quantity: 15,  costPrice: 490.00, costBasis: 7350,  closePrice: 585.40, marketValue: 8781,  unrealizedPL: 1431  },
      { symbol: 'VOO',   quantity: 60,  costPrice: 430.00, costBasis: 25800, closePrice: 498.60, marketValue: 29916, unrealizedPL: 4116  },
      { symbol: 'QQQ',   quantity: 35,  costPrice: 410.00, costBasis: 14350, closePrice: 482.10, marketValue: 16873, unrealizedPL: 2523  },
    ],

    realizedUnrealized: [
      { symbol: 'NVDA',  realizedTotal: 3240,  unrealizedTotal: 19760 },
      { symbol: 'AAPL',  realizedTotal: 820,   unrealizedTotal: 3784  },
      { symbol: 'MSFT',  realizedTotal: 0,     unrealizedTotal: 1824  },
      { symbol: 'GOOGL', realizedTotal: -380,  unrealizedTotal: 972   },
      { symbol: 'AMZN',  realizedTotal: 560,   unrealizedTotal: 457   },
      { symbol: 'META',  realizedTotal: 1200,  unrealizedTotal: 1431  },
      { symbol: 'VOO',   realizedTotal: 0,     unrealizedTotal: 4116  },
      { symbol: 'QQQ',   realizedTotal: 0,     unrealizedTotal: 2523  },
      { symbol: 'TSLA',  realizedTotal: -1540, unrealizedTotal: 0     },
      { symbol: 'AMD',   realizedTotal: 960,   unrealizedTotal: 0     },
    ],

    trades: [
      // NVDA
      { symbol: 'NVDA',  dateTime: '2025-01-08, 09:32:00', quantity:  50, price: 480.00, proceeds: -24000, commission: -0.50, basis: 24000,  realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      { symbol: 'NVDA',  dateTime: '2025-03-12, 10:15:00', quantity: -20, price: 642.00, proceeds:  12840, commission: -0.35, basis: -9600,  realizedPL: 3240,  mtmPL: 0,     code: 'C'  },
      { symbol: 'NVDA',  dateTime: '2025-03-12, 10:15:01', quantity:  20, price: 648.00, proceeds: -12960, commission: -0.35, basis: 12960,  realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      // AAPL
      { symbol: 'AAPL',  dateTime: '2025-01-15, 09:45:00', quantity:  80, price: 178.50, proceeds: -14280, commission: -0.40, basis: 14280,  realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      { symbol: 'AAPL',  dateTime: '2025-06-20, 14:30:00', quantity: -20, price: 219.60, proceeds:   4392, commission: -0.20, basis: -3570,  realizedPL: 820,   mtmPL: 0,     code: 'C'  },
      { symbol: 'AAPL',  dateTime: '2025-06-20, 14:30:01', quantity:  20, price: 219.80, proceeds:  -4396, commission: -0.20, basis: 4396,   realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      // MSFT
      { symbol: 'MSFT',  dateTime: '2025-02-03, 10:00:00', quantity:  40, price: 370.00, proceeds: -14800, commission: -0.40, basis: 14800,  realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      // GOOGL
      { symbol: 'GOOGL', dateTime: '2025-01-22, 11:20:00', quantity:  30, price: 140.00, proceeds:  -4200, commission: -0.30, basis: 4200,   realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      { symbol: 'GOOGL', dateTime: '2025-05-08, 09:55:00', quantity: -10, price: 156.20, proceeds:   1562, commission: -0.15, basis: -1400,  realizedPL: -380,  mtmPL: 0,     code: 'C'  },
      { symbol: 'GOOGL', dateTime: '2025-05-08, 09:55:01', quantity:  10, price: 157.00, proceeds:  -1570, commission: -0.15, basis: 1570,   realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      // AMZN
      { symbol: 'AMZN',  dateTime: '2025-02-14, 10:30:00', quantity:  25, price: 178.00, proceeds:  -4450, commission: -0.25, basis: 4450,   realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      { symbol: 'AMZN',  dateTime: '2025-08-19, 13:45:00', quantity: -15, price: 215.40, proceeds:   3231, commission: -0.18, basis: -2670,  realizedPL: 560,   mtmPL: 0,     code: 'C'  },
      { symbol: 'AMZN',  dateTime: '2025-08-19, 13:45:01', quantity:  15, price: 216.00, proceeds:  -3240, commission: -0.18, basis: 3240,   realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      // META
      { symbol: 'META',  dateTime: '2025-03-05, 09:40:00', quantity:  15, price: 490.00, proceeds:  -7350, commission: -0.30, basis: 7350,   realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      { symbol: 'META',  dateTime: '2025-07-11, 10:20:00', quantity:  -5, price: 730.00, proceeds:   3650, commission: -0.15, basis: -2450,  realizedPL: 1200,  mtmPL: 0,     code: 'C'  },
      { symbol: 'META',  dateTime: '2025-07-11, 10:20:01', quantity:   5, price: 731.50, proceeds:  -3657, commission: -0.15, basis: 3657,   realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      // VOO & QQQ
      { symbol: 'VOO',   dateTime: '2025-01-10, 09:30:00', quantity:  60, price: 430.00, proceeds: -25800, commission: -0.30, basis: 25800,  realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      { symbol: 'QQQ',   dateTime: '2025-01-10, 09:31:00', quantity:  35, price: 410.00, proceeds: -14350, commission: -0.20, basis: 14350,  realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      // TSLA — closed position (loss)
      { symbol: 'TSLA',  dateTime: '2025-02-20, 11:00:00', quantity:  30, price: 350.00, proceeds: -10500, commission: -0.35, basis: 10500,  realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      { symbol: 'TSLA',  dateTime: '2025-04-15, 14:00:00', quantity: -30, price: 298.67, proceeds:   8960, commission: -0.30, basis: -10500, realizedPL: -1540, mtmPL: 0,     code: 'C'  },
      // AMD — closed position (gain)
      { symbol: 'AMD',   dateTime: '2025-05-01, 09:50:00', quantity:  40, price: 152.00, proceeds:  -6080, commission: -0.30, basis: 6080,   realizedPL: 0,     mtmPL: 0,     code: 'O'  },
      { symbol: 'AMD',   dateTime: '2025-09-22, 10:10:00', quantity: -40, price: 176.00, proceeds:   7040, commission: -0.25, basis: -6080,  realizedPL: 960,   mtmPL: 0,     code: 'C'  },
    ],
  }
}
