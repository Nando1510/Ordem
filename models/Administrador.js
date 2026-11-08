const mongoose = require('mongoose');

// const Nome_Primeira_Letra_MaiusculaSchema = new mongoo.Schema({
const AdministradorSchema = new mongoose.Schema({
  customId: { type: Number, unique: true, required: true },

  //  Isso garante que o nome seja único no banco 
  nome: { type: String, required: true, unique: true  },
  senha: { type: String, required: true },
  celular: {
    type: Number, required: true }
  }, { timestamps: true });

//module.exports = mongoose.model = ('Nome_Primeira_Letra_Maiuscula', Nome_Primeira_Letra_MaiusculaSchema);
module.exports = mongoose.model('Administrador', AdministradorSchema);