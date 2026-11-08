const mongoose = require('mongoose');

const VendaSchema = new mongoose.Schema({
    customId: { type: Number },
    produtos: [{
        produtoId: { type: String },
        quantidade: { type: Number, required: true },
        precoUnitario: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    formaPagamento: { type: String, default: 'Dinheiro' },
    cpfCliente: { type: String, default: null },
    data: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Venda || mongoose.model('Venda', VendaSchema);