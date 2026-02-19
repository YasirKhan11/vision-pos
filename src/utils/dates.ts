export const toDateStringForMock = (date: Date) => date.toISOString().split('T')[0];
export const getTodayDateString = () => new Date().toISOString().split('T')[0];
