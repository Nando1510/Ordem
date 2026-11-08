const mongoose = require('mongoose');

const ordemServicoSchema = new mongoose.Schema({
    clienteId: { type: String, required: true },
    numeroOS: { type: String, unique: true },
    equipamento: { type: String, required: true },
    marcaModelo: { type: String },
    numeroSerie: { type: String },
    patrimonio: { type: String },
    defeito: { type: String },
    servicoRealizar: { type: String },
    
    // Garantias
    garantiaServicoAnterior: { type: Boolean, default: false },
    garantiaCompra: { type: Boolean, default: false },
    tempoGarantia: { type: String, default: '90 dias' },

    // Datas (definidas como String para compatibilidade total com <input type="date">)
    dataEntrada: { type: String },
    dataSaida: { type: String },

    // Peças Utilizadas
    pecas: [{
        produtoId: { type: String, required: true },
        descricao: { type: String, required: true },
        quantidade: { type: Number, required: true, default: 1 },
        valorUnitario: { type: Number, required: true, default: 0 },
        subtotal: { type: Number, required: true, default: 0 }
    }],

    situacao: { type: String, default: 'Aguardando' },
    valorMaoObra: { type: Number, default: 0 }, // <--- Adicionado para suportar valor de mão de obra
    valorTotal: { type: Number, default: 0 }
}, {
    timestamps: true
});

const OrdemServico = mongoose.model('OrdemServico', ordemServicoSchema);

module.exports = OrdemServico;