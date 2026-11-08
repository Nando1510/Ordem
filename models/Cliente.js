const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema(
  {
    customId: {
      type: Number,
      unique: true,
      required: true
    },
    nome: {
      type: String,
      required: true,
      trim: true
    },
    cpf_cnpj: {
      type: String,
      required: true,
      trim: true
    },
    telefone: {
      type: String,
      default: '',
      trim: true
    },
    celular: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true
    },
    rua: {
      type: String,
      default: '',
      trim: true
    },
    numero: {
      type: String,
      default: '',
      trim: true
    },
    bairro: {
      type: String,
      default: '',
      trim: true
    },
    cidade: {
      type: String,
      required: true,
      trim: true
    },
    estado: {
      type: String,
      default: '',
      trim: true
    },
    cep: {
      type: String,
      default: '',
      trim: true
    }
  },
  { 
    timestamps: true // Cria automaticamente os campos createdAt e updatedAt
  }
);

module.exports = mongoose.model('Cliente', ClienteSchema);