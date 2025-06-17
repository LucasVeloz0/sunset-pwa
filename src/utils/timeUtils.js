// Função utilitária para formatar horários
export const formatTime = (date) => {
  if (!date) return '--:--';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}