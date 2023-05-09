// const { Fernet } = require('fernet-nodejs');

// const key = Fernet.generateKey();

// let confirmationCode = {
//   code: 'HxD3572Aa788UHUXsTc8HSrnSq-1Ktnn-FAqtu_1ikg=',
//   expires: '1690539842'
// };
// confirmationCode = JSON.stringify(confirmationCode);
// const fernetToken = Fernet.encrypt(confirmationCode, key);
// const bufferToken = Buffer.from(fernetToken).toString('base64');
// console.log(bufferToken);
// const token = Buffer.from(bufferToken, 'base64').toString();
// const decryptedText = Fernet.decrypt(token, key);

// console.log(decryptedText);

const currentDate = new Date();
const twentyMinutesLater = currentDate.getTime() + 20 * 60 * 1000;

console.log(twentyMinutesLater, currentDate.getTime());

console.log(currentDate.getTime() <= 1683194215920);
