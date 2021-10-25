
// export const AUCTIONS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' // Local
// export const AUCTIONS = '0xc71f367cd67788771b7eDeF9498F699a473Ae92C' // Mainnet
// export const AUCTIONS = '0x51A1ceB83B83F1985a81C295d1fF28Afef186E02' // Local with mainnet forking
export const AUCTIONS = process.env.NODE_ENV !== 'production' ?
                        '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' : // Local
                        '0xc71f367cd67788771b7eDeF9498F699a473Ae92C' // Mainnet

// export const TUXTOKEN = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // Local
// export const TUXTOKEN = '0x...' // Mainnet
// export const TUXTOKEN = '0xDC11f7E700A4c898AE5CAddB1082cFfa76512aDD' // Local with mainnet forking
export const TUXTOKEN = process.env.NODE_ENV !== 'production' ?
                        '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' :
                        '0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2'

// export const TUX = '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Local
// export const TUX = '0xc83FcA08E12e609E747c13C9297a770CE1955A0D' // Mainnet
// export const TUX = '0xD8a5a9b31c3C0232E196d518E89Fd8bF83AcAd43' // Local with mainnet forking
export const TUX = process.env.NODE_ENV !== 'production' ?
                   '0x5FbDB2315678afecb367f032d93F642f64180aa3' : // Local
                   '0xc83FcA08E12e609E747c13C9297a770CE1955A0D' // Mainnet
