// Dados da planta (em metros). Eixo X = profundidade do lote (0 = rua, 20 = fundos);
// eixo Z = largura do lote (0 = divisa "de cima" da planta, 10 = corredor lateral).
// Pavimento térreo em Y = 0, superior em Y = 3,00.

export const LOT = { w: 20, d: 10 };
export const FLOOR2 = 3.0; // piso do pavimento superior
export const CEIL1 = 2.8; // forro do térreo
export const CEIL2 = 5.8; // forro do superior (pé-direito duplo da sala ≈ 5,80)
export const TOP = 6.5; // topo da platibanda

// Cômodos — usados para o nome na tela, minimapa e teletransporte.
// spawn = ponto de chegada [x, z, direção em graus (0 = olhando para +X/fundos)]
export const ROOMS = [
  // Térreo
  { id: 'garagem', name: 'Garagem (vagas coberta e descoberta)', floor: 0, x0: 0, z0: 0, x1: 5, z1: 6.6, size: '2,80 x 5,00 + 2,70 x 5,00', spawn: [1.2, 3.35, 0] },
  { id: 'escritorio', name: 'Escritório', floor: 0, x0: 5, z0: 0, x1: 6.6, z1: 1.8, size: '1,60 x 1,80', spawn: [5.8, 1.5, -90] },
  { id: 'sala', name: 'Sala de Estar (pé-direito duplo)', floor: 0, x0: 5, z0: 0, x1: 10.4, z1: 5.2, size: '3,80 x 4,80', spawn: [5.6, 3.45, 0] },
  { id: 'cozinha', name: 'Cozinha / Copa', floor: 0, x0: 10.4, z0: 0, x1: 16.6, z1: 5.2, size: '6,20 x 3,90', spawn: [11.9, 3.7, -20] },
  { id: 'quarto1', name: 'Quarto 1', floor: 0, x0: 5, z0: 5.2, x1: 8, z1: 8.5, size: '3,00 x 3,00', spawn: [7.4, 5.6, 140] },
  { id: 'banhosocial', name: 'Banho Social', floor: 0, x0: 8, z0: 5.2, x1: 9.2, z1: 8.5, size: '1,20 x 2,00', spawn: [8.6, 5.7, 90] },
  { id: 'quarto2', name: 'Quarto 2', floor: 0, x0: 9.2, z0: 5.2, x1: 12.2, z1: 8.5, size: '3,00 x 3,00', spawn: [9.8, 5.6, 40] },
  { id: 'lavabo', name: 'Lavabo', floor: 0, x0: 12.2, z0: 5.2, x1: 13.4, z1: 7.2, size: '1,20 x 1,80', spawn: [12.8, 4.6, 90] },
  { id: 'despensa', name: 'Despensa', floor: 0, x0: 13.4, z0: 5.2, x1: 14.9, z1: 7.2, size: '1,50 x 2,00', spawn: [14.1, 4.6, 90] },
  { id: 'lavanderia', name: 'Lavanderia', floor: 0, x0: 14.9, z0: 5.2, x1: 16.6, z1: 8.5, size: '1,50 x 2,00', spawn: [15.6, 4.6, 90] },
  { id: 'gourmet', name: 'Área Gourmet (churrasqueira)', floor: 0, x0: 16.6, z0: 5.0, x1: 20, z1: 8.5, size: '2,90 x 3,00', spawn: [17.0, 5.4, 45] },
  { id: 'piscina', name: 'Piscina e Deck', floor: 0, x0: 16.6, z0: 0, x1: 20, z1: 5.0, size: 'Piscina 3,00 x 2,00', spawn: [16.9, 4.3, -40] },
  { id: 'corredor', name: 'Corredor Lateral', floor: 0, x0: 0, z0: 8.5, x1: 20, z1: 10, size: '1,50 x 20,00', spawn: [1.0, 9.1, 0] },
  { id: 'jardim', name: 'Jardim frontal', floor: 0, x0: 0, z0: 6.6, x1: 5, z1: 8.5, size: '', spawn: [-3, 5, 0] },
  { id: 'rua', name: 'Rua do condomínio', floor: 0, x0: -12, z0: -10, x1: 0, z1: 20, size: '', spawn: [-6.5, 4.2, 0] },
  // Superior
  { id: 'circulacao', name: 'Circulação (mezanino)', floor: 1, x0: 5, z0: 2.88, x1: 12.4, z1: 6.5, size: '1,30 m', spawn: [11.0, 4.6, 180] },
  { id: 'suitemaster', name: 'Suíte Master', floor: 1, x0: 6.5, z0: 5.3, x1: 10, z1: 8.5, size: '3,50 x 3,20', spawn: [9.4, 5.7, 135] },
  { id: 'banhomaster', name: 'Banho Master', floor: 1, x0: 5, z0: 6, x1: 6.5, z1: 8.5, size: '2,50 x 1,50', spawn: [6.9, 6.55, 180] },
  { id: 'closet', name: 'Closet', floor: 1, x0: 10, z0: 6.5, x1: 12.4, z1: 8.5, size: '2,40 x 2,00', spawn: [9.6, 7.4, 0] },
  { id: 'suiteisabela', name: 'Suíte Isabela', floor: 1, x0: 12.4, z0: 2.3, x1: 15.4, z1: 5.3, size: '3,00 x 3,00', spawn: [12.0, 3.4, 0] },
  { id: 'banhoisabela', name: 'Banho Isabela', floor: 1, x0: 14.2, z0: 5.3, x1: 15.4, z1: 7.3, size: '1,20 x 2,00', spawn: [14.9, 4.8, 90] },
  { id: 'estar', name: 'Estar íntimo', floor: 1, x0: 12.4, z0: 5.3, x1: 14.2, z1: 8.5, size: '', spawn: [11.6, 5.9, 20] },
  { id: 'vazio', name: 'Vazio (pé-direito duplo)', floor: 1, x0: 5, z0: 0, x1: 11.5, z1: 4.0, size: '', spawn: null },
  { id: 'luz', name: 'Poço de luz e ventilação', floor: 1, x0: 12.4, z0: 0, x1: 15.4, z1: 2.3, size: '', spawn: null },
];

export function roomAt(x, z, y) {
  const floor = y > FLOOR2 - 0.5 ? 1 : 0;
  for (const r of ROOMS) {
    if (r.floor === floor && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r;
  }
  if (y > 0.4 && y < FLOOR2 - 0.5 && x > 7.4 && x < 11.6 && z < 3) return { name: 'Escada' };
  return null;
}
