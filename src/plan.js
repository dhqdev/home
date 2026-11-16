// Dados da planta (em metros) — "Planta Baixa – Cotas, Alinhamento e Áreas (Corrigido)".
// Eixo X = profundidade do lote (0 = rua, 20 = fundos). Eixo Z = largura (0 = lado esquerdo
// de quem olha da rua, onde ficam escritório/sala/cozinha; 8,5 a 10 = recuo lateral de 1,50 m).
// Casa: X de 5,00 a 17,20 (12,20 m) e Z de 0 a 8,50. Térreo em Y = 0, superior em Y = 3,00.

export const LOT = { w: 20, d: 10 };
export const FLOOR2 = 3.0;
export const CEIL1 = 2.8;
export const CEIL2 = 5.8;
export const TOP = 6.4;
export const HX0 = 5.0; // fachada frontal
export const HX1 = 17.2; // fachada dos fundos
export const HZ = 8.5; // largura da casa

// spawn = [x, z, direção em graus (0 = olhando para os fundos, 90 = para a direita)]
export const ROOMS = [
  // Térreo
  { id: 'garagem', name: 'Garagem', floor: 0, x0: 0, z0: 0, x1: 5, z1: 6.1, size: 'Vaga coberta 2,80 x 5,00 · descoberta 2,70 x 5,00', spawn: [0.5, 3.4, 0] },
  { id: 'entrada', name: 'Acesso / jardim frontal', floor: 0, x0: 0, z0: 6.1, x1: 5, z1: 8.5, size: '', spawn: [0.5, 7.3, 0] },
  { id: 'escritorio', name: 'Escritório', floor: 0, x0: 5, z0: 0, x1: 6.2, z1: 1.8, size: '1,20 x 1,80', spawn: [5.75, 1.45, -100] },
  { id: 'sala', name: 'Sala de Estar (pé-direito duplo)', floor: 0, x0: 5, z0: 0, x1: 11.0, z1: 3.9, size: '3,80 x 4,80', spawn: [9.6, 3.3, -150] },
  { id: 'circ', name: 'Hall / corredor', floor: 0, x0: 5, z0: 3.9, x1: 12.2, z1: 5.3, size: '', spawn: [5.4, 4.6, 0] },
  { id: 'cozinha', name: 'Cozinha / Copa', floor: 0, x0: 11.0, z0: 0, x1: 17.2, z1: 6.5, size: '6,20 x 3,90', spawn: [12.0, 4.5, -45] },
  { id: 'quarto1', name: 'Quarto 1', floor: 0, x0: 5, z0: 5.3, x1: 8, z1: 8.5, size: '3,00 x 3,00', spawn: [7.4, 5.6, 140] },
  { id: 'banhosocial', name: 'Banho Social', floor: 0, x0: 8, z0: 5.3, x1: 9.2, z1: 8.5, size: '1,20 x 2,00', spawn: [8.6, 5.7, 90] },
  { id: 'quarto2', name: 'Quarto 2', floor: 0, x0: 9.2, z0: 5.3, x1: 12.2, z1: 8.5, size: '3,00 x 3,00', spawn: [9.8, 5.6, 40] },
  { id: 'lavabo', name: 'Lavabo', floor: 0, x0: 12.2, z0: 6.5, x1: 13.4, z1: 8.5, size: '1,20 x 1,80', spawn: [12.8, 5.6, 90] },
  { id: 'despensa', name: 'Despensa', floor: 0, x0: 13.4, z0: 6.5, x1: 14.9, z1: 8.5, size: '1,50 x 2,00', spawn: [14.15, 5.6, 90] },
  { id: 'lavanderia', name: 'Lavanderia', floor: 0, x0: 14.9, z0: 6.5, x1: 17.2, z1: 8.5, size: '1,50 x 2,00', spawn: [15.6, 5.6, 90] },
  { id: 'gourmet', name: 'Área Gourmet (churrasqueira)', floor: 0, x0: 17.2, z0: 5.5, x1: 20, z1: 8.5, size: '2,90 x 3,00', spawn: [17.9, 5.0, 45] },
  { id: 'piscina', name: 'Piscina e deck', floor: 0, x0: 17.2, z0: 0, x1: 20, z1: 5.5, size: 'Piscina 3,00 x 2,00', spawn: [17.45, 4.6, -40] },
  { id: 'corredor', name: 'Recuo lateral', floor: 0, x0: 0, z0: 8.5, x1: 20, z1: 10, size: '1,50 x 20,00', spawn: [1.0, 9.25, 0] },
  { id: 'rua', name: 'Rua do condomínio', floor: 0, x0: -12, z0: -10, x1: 0, z1: 20, size: '', spawn: [-3.5, 6.8, -18] },
  // Superior
  { id: 'circulacao', name: 'Circulação (mezanino)', floor: 1, x0: 5, z0: 2.78, x1: 12.7, z1: 5.2, size: '1,30 x 6,00', spawn: [11.5, 3.4, 180] },
  { id: 'banhomaster', name: 'Banho Master', floor: 1, x0: 5, z0: 5.2, x1: 6.5, z1: 7.7, size: '2,50 x 1,50', spawn: [7.0, 5.75, 180] },
  { id: 'suitemaster', name: 'Suíte Master', floor: 1, x0: 5, z0: 5.2, x1: 9.7, z1: 8.5, size: '3,50 x 3,20', spawn: [9.1, 5.6, 110] },
  { id: 'closet', name: 'Closet', floor: 1, x0: 9.7, z0: 5.2, x1: 11.7, z1: 8.5, size: '2,40 x 2,00', spawn: [9.2, 7.4, 0] },
  { id: 'hall2', name: 'Circulação', floor: 1, x0: 11.7, z0: 5.2, x1: 12.7, z1: 8.5, size: '', spawn: null },
  { id: 'luz', name: 'Luz e ventilação', floor: 1, x0: 12.1, z0: 0, x1: 13.6, z1: 2.9, size: '2,90 x 1,50', spawn: null },
  { id: 'suiteisabela', name: 'Suíte Isabela', floor: 1, x0: 12.7, z0: 4.3, x1: 15.7, z1: 8.5, size: '3,00 x 3,00', spawn: [12.3, 4.75, 0] },
  { id: 'banhoisabela', name: 'Banho Isabela', floor: 1, x0: 13.7, z0: 7.3, x1: 15.7, z1: 8.5, size: '1,20 x 2,00', spawn: [13.2, 7.9, 0] },
  { id: 'estar', name: 'Estar íntimo', floor: 1, x0: 12.1, z0: 0, x1: 15.7, z1: 4.3, size: '', spawn: [12.9, 3.4, -30] },
  { id: 'varanda', name: 'Varanda (vista da piscina)', floor: 1, x0: 15.7, z0: 0, x1: 17.2, z1: 8.5, size: '1,50 m', spawn: [16.0, 3.6, -20] },
  { id: 'vazio', name: 'Vazio (pé-direito duplo)', floor: 1, x0: 5, z0: 0, x1: 12.1, z1: 3.9, size: '3,80 x 4,80', spawn: null },
];

export function roomAt(x, z, y) {
  const floor = y > FLOOR2 - 0.5 ? 1 : 0;
  if (y > 0.3 && y < FLOOR2 - 0.4 && x > 8.3 && x < 12.2 && z < 2.9) return { name: 'Escada' };
  // procura do cômodo mais específico (menor área) que contém o ponto
  let best = null, area = Infinity;
  for (const r of ROOMS) {
    if (r.floor !== floor || r.id === 'vazio') continue;
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) {
      const a = (r.x1 - r.x0) * (r.z1 - r.z0);
      if (a < area) (best = r), (area = a);
    }
  }
  return best;
}
