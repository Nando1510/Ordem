const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema(
  {
    customId: { 
      type: String, // <-- Alterado de Number para String
      required: [true, 'O customId é obrigatório.'],
      unique: true,
      trim: true
    },
    descricao: { 
      type: String, 
      required: [true, 'A descrição do produto é obrigatória.'], 
      trim: true 
    },
    qtd_adicionar: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    qtd_atual: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    preco_compra: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    preco_unitario: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    preco_venda: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    estoque_minimo: { 
      type: Number, 
      required: true, 
      default: 0 
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model('Produto', ProdutoSchema);