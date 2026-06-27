export function generateTrackingId(category: string): string {
  const prefix = 'UIQ';
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit number
  
  // Create category code
  let catCode = 'GEN';
  if (category) {
    const cleanCat = category.toLowerCase();
    if (cleanCat.includes('pothole')) catCode = 'POT';
    else if (cleanCat.includes('garbage')) catCode = 'GAR';
    else if (cleanCat.includes('water')) catCode = 'WAT';
    else if (cleanCat.includes('drain')) catCode = 'DRN';
    else if (cleanCat.includes('streetlight')) catCode = 'LGT';
    else if (cleanCat.includes('road')) catCode = 'RD';
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChar1 = chars[Math.floor(Math.random() * chars.length)];
  const randomChar2 = chars[Math.floor(Math.random() * chars.length)];
  
  return `${prefix}-${randomNum}-${catCode}${randomChar1}${randomChar2}`;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
