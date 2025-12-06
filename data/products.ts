export type PackType = 'Normal' | 'Vacuum' | 'Container';
export type ContainerColor = 'Gold' | 'Silver' | undefined;

export interface ProductDefinition {
  family: string;
  type: PackType;
  containerColor?: ContainerColor;
  displayName: string;
  sizes: string[];
  getPktWeight: (size: string) => number;
  getCtnWeight: (size: string) => number;
}

const STANDARD_SIZES_A = ["2.5 x 350", "3.2 x 350", "4.0 x 350", "5.0 x 350"];
const STANDARD_SIZES_B = ["2.5 x 350", "3.2 x 350", "3.2 x 450", "4.0 x 350", "4.0 x 450", "5.0 x 350", "5.0 x 450"];

export const PRODUCT_CATALOG: ProductDefinition[] = [
  // --- 6013 ---
  {
    family: "6013",
    type: "Normal",
    displayName: "SPARKWELD 6013",
    sizes: ["2.6 x 350", "3.2 x 350", "4.0 x 350", "4.0 x 400", "5.0 x 350"],
    getPktWeight: (size) => size.startsWith("2.6") ? 2 : 4,
    getCtnWeight: () => 16
  },
  
  // --- 7018 ---
  {
    family: "7018",
    type: "Normal",
    displayName: "SPARKWELD 7018",
    sizes: STANDARD_SIZES_B,
    getPktWeight: () => 5,
    getCtnWeight: () => 20
  },
  {
    family: "7018",
    type: "Vacuum",
    displayName: "VACUUM 7018",
    sizes: ["2.5 x 350", "3.2 x 350", "4.0 x 350", "5.0 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  },

  // --- 7018-1 ---
  {
    family: "7018-1",
    type: "Normal",
    displayName: "SPARKWELD 7018-1",
    sizes: STANDARD_SIZES_B,
    getPktWeight: () => 5, // Assuming same as 7018 Normal
    getCtnWeight: () => 20
  },
  {
    family: "7018-1",
    type: "Vacuum",
    displayName: "VACUUM 7018-1",
    sizes: ["2.5 x 350", "3.2 x 350", "4.0 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  },

  // --- Ni / NiFe (Containers) ---
  {
    family: "Ni",
    type: "Container",
    containerColor: "Gold",
    displayName: "SPARKWELD Ni",
    sizes: ["2.5 x 350", "3.2 x 350", "4.0 x 350"],
    getPktWeight: () => 1,
    getCtnWeight: () => 10
  },
  {
    family: "NiFe",
    type: "Container",
    containerColor: "Silver",
    displayName: "SPARKWELD NiFe",
    sizes: ["2.5 x 350", "3.2 x 350", "4.0 x 350"],
    getPktWeight: () => 1,
    getCtnWeight: () => 10
  },

  // --- 8018-C3 ---
  {
    family: "8018-C3",
    type: "Normal",
    displayName: "SPARKWELD 8018-C3",
    sizes: ["2.5 x 350", "3.2 x 350", "4.0 x 350"],
    getPktWeight: () => 5, // Assumed similar to 7018 Normal
    getCtnWeight: () => 20
  },
  {
    family: "8018-C3",
    type: "Vacuum",
    displayName: "VACUUM 8018-C3",
    sizes: ["2.5 x 350", "3.2 x 350", "4.0 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  },

  // --- 7024 (Vacuum Only) ---
  {
    family: "7024",
    type: "Vacuum",
    displayName: "SPARKWELD 7024", // Kept branding as SPARKWELD per prompt list, though typically vacuum
    sizes: ["2.6 x 350", "3.2 x 350", "4.0 x 450", "5.0 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  },

  // --- 8018-B2 (Vacuum Only) ---
  {
    family: "8018-B2",
    type: "Vacuum",
    displayName: "VACUUM 8018-B2",
    sizes: ["2.5 x 350", "3.2 x 350", "4.0 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  },

  // --- 10018 Variants (Vacuum Only) ---
  {
    family: "10018-M",
    type: "Vacuum",
    displayName: "VACUUM 10018-M",
    sizes: ["3.2 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  },
  {
    family: "10018-G",
    type: "Vacuum",
    displayName: "VACUUM 10018-G",
    sizes: ["3.2 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  },
  {
    family: "10018-D2",
    type: "Vacuum",
    displayName: "VACUUM 10018-D2",
    sizes: ["4.0 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  },

  // --- 8018-G (Vacuum Only) ---
  {
    family: "8018-G",
    type: "Vacuum",
    displayName: "VACUUM 8018-G",
    sizes: ["2.5 x 350", "3.2 x 350", "4.0 x 350"],
    getPktWeight: () => 2,
    getCtnWeight: () => 20
  }
];

export const getFamilies = () => Array.from(new Set(PRODUCT_CATALOG.map(p => p.family)));

export const getTypesForFamily = (family: string) => 
  PRODUCT_CATALOG.filter(p => p.family === family);

export const getProductDef = (family: string, type: string) => 
  PRODUCT_CATALOG.find(p => p.family === family && p.type === type);
