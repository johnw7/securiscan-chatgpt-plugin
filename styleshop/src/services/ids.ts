export const uid = () => Math.random().toString(36).slice(2, 10);

export const orderNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `SS-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
};
