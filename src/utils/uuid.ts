// MARK: - generateTemporaryId
export const generateTemporaryId = () => {
  const storedId = localStorage.getItem('playerId');
  if (storedId) {
    return storedId;
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) / 16;
      if (char === 'x') {
        return Math.floor(random * 16).toString(16);
      }
      return ((Math.floor(random * 16) & 0x3) | 0x8).toString(16);
    });
  };

  const newId = generateUUID();
  localStorage.setItem('playerId', newId);
  console.log('Created playerId: ', newId);
  return newId;
};
