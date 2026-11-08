// visualizar_OS.js

// Variável global para armazenar o ID da OS com segurança
let osIdGlobal = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Pega o ID da OS que veio na URL (ex: ?id=19)
    const urlParams = new URLSearchParams(window.location.search);
    osIdGlobal = urlParams.get('id') || urlParams.get('osId') || urlParams.get('_id');

    if (!osIdGlobal) {
        alert('Ordem de Serviço não identificada!');
        window.history.back();
        return;
    }

    // Elementos HTML do cliente
    const lblCliente = document.getElementById('lbl-cliente');
    const lblCpf = document.getElementById('lbl-cpf');
    const lblCidade = document.getElementById('lbl-cidade');
    const lblCelular = document.getElementById('lbl-celular');

    try {
        // 2. Busca os dados da OS no backend
        const resposta = await fetch(`/obter_os/${osIdGlobal}`);
        if (!resposta.ok) throw new Error('Não foi possível carregar os dados da OS.');

        let os = await resposta.json();
        console.log("Dados recebidos da OS:", os);

        // 3. Verifica se tem número da OS. Se não tiver, GERA E SALVA automaticamente!
        let numeroOS = os.numeroOS;
        
        if (!numeroOS || numeroOS === '---' || numeroOS === null || numeroOS === undefined) {
            try {
                const respGerar = await fetch(`/gerar_numero_os/${osIdGlobal}`, { method: 'POST' });
                if (respGerar.ok) {
                    const dadosAtualizados = await respGerar.json();
                    os = dadosAtualizados;
                    numeroOS = os.numeroOS;
                }
            } catch (errGerar) {
                console.error("Erro ao gerar número automático da OS:", errGerar);
            }
        }

        // Exibe o número na tela
        document.getElementById('numeroOS').textContent = numeroOS || os.id || '---';

        // 4. Dados do Cliente
        let nomeCliente = '---';
        let cpfCliente = '---';
        let cidadeCliente = '---';
        let celularCliente = '---';

        const clienteObj = os.cliente || os.dadosCliente || os.clienteObj;

        if (clienteObj) {
            nomeCliente = clienteObj.nome || clienteObj.nomeCliente || clienteObj.razaoSocial || '---';
            cpfCliente = clienteObj.cpf_cnpj || clienteObj.cpf || clienteObj.cnpj || '---';
            cidadeCliente = clienteObj.cidade || clienteObj.municipio || '---';
            celularCliente = clienteObj.celular || clienteObj.telefone || clienteObj.fone || clienteObj.whatsapp || '---';
        } else {
            nomeCliente = os.nomeCliente || os.nome_cliente || os.nome || '---';
            cpfCliente = os.cpf_cnpj || os.cpf || os.cpfCliente || os.cnpj || '---';
            cidadeCliente = os.cidade || os.cidadeCliente || os.cidade_cliente || '---';
            celularCliente = os.celular || os.telefone || os.fone || os.celularCliente || '---';

            const clienteId = os.clienteId || os.cliente_id || os.idCliente || os.id_cliente;

            if ((nomeCliente === '---' || !nomeCliente) && clienteId) {
                try {
                    const rotaCliente = `/buscar_Cliente/${clienteId}`;
                    const respCliente = await fetch(rotaCliente);

                    if (respCliente && respCliente.ok) {
                        const cliData = await respCliente.json();
                        nomeCliente = cliData.nome || '---';
                        cpfCliente = cliData.cpf_cnpj || cliData.cpf || '---';
                        cidadeCliente = cliData.cidade || '---';
                        celularCliente = cliData.celular || cliData.telefone || '---';
                    }
                } catch (cliErr) {
                    console.error("Erro na busca do cliente:", cliErr);
                }
            }
        }

        if (lblCliente) lblCliente.textContent = nomeCliente;
        if (lblCpf) lblCpf.textContent = cpfCliente;
        if (lblCidade) lblCidade.textContent = cidadeCliente;
        if (lblCelular) lblCelular.textContent = celularCliente;

        // 5. Equipamento e Informações Principais
        const campoEquipamento = document.getElementById('equipamento');
        if (campoEquipamento) campoEquipamento.value = os.equipamento || '';

        const campoMarca = document.getElementById('marcaModelo');
        if (campoMarca) campoMarca.value = os.marcaModelo || os.marca_modelo || '';
        
        const lblSerie = document.getElementById('lbl-serie');
        if (lblSerie) lblSerie.textContent = os.numeroSerie || os.serie || os.numero_serie || '---';

        const lblPatrimonio = document.getElementById('lbl-patrimonio');
        if (lblPatrimonio) lblPatrimonio.textContent = os.patrimonio || '---';
        
        // Datas
        const dataEntrada = os.dataEntrada || os.data_entrada || os.criadoEm;
        const lblDataEntrada = document.getElementById('lbl-data-entrada');
        if (lblDataEntrada) lblDataEntrada.textContent = formatarData(dataEntrada);

        const previsaoSaida = os.dataSaida || os.previsaoSaida || os.previsao_saida || os.dataPrevisao;
        const lblDataSaida = document.getElementById('lbl-data-saida');
        if (lblDataSaida) lblDataSaida.textContent = formatarData(previsaoSaida);

        // Garantia e Opções de Garantia (Serviço Anterior e Compra)
        const garantiaVal = os.tempoGarantia || os.garantia || os.prazoGarantia;
        const lblGarantia = document.getElementById('lbl-garantia');
        if (lblGarantia) lblGarantia.textContent = garantiaVal ? `${garantiaVal} dias` : '---';

        // Garantia de Serviço Anterior (Sim / Não)
        const lblGarantiaAnt = document.getElementById('lbl-garantia-servico-anterior') || document.getElementById('lbl-garantiaServicoAnterior');
        if (lblGarantiaAnt) {
            const valAnt = os.garantiaServicoAnterior;
            lblGarantiaAnt.textContent = (valAnt === true || valAnt === 'Sim' || valAnt === 'on') ? 'Sim' : 'Não';
        }

        // Garantia de Compra / Fábrica (Sim / Não)
        const lblGarantiaComp = document.getElementById('lbl-garantia-compra') || document.getElementById('lbl-garantiaCompra');
        if (lblGarantiaComp) {
            const valComp = os.garantiaCompra;
            lblGarantiaComp.textContent = (valComp === true || valComp === 'Sim' || valComp === 'on') ? 'Sim' : 'Não';
        }

        // Situação
        const selectSituacao = document.getElementById('situacao');
        if (selectSituacao && os.situacao) {
            selectSituacao.value = os.situacao;
        }

        // 6. Defeito e Laudo
        const campoDefeito = document.getElementById('defeito');
        if (campoDefeito) campoDefeito.value = os.defeito || os.defeitoReclamado || os.defeito_reclamado || '';

        const campoServico = document.getElementById('servicoRealizar');
        if (campoServico) campoServico.value = os.servicoRealizar || os.laudo || os.servico_realizado || '';

        // 7. Peças / Componentes
        const listaPecas = os.pecas || os.itens || os.componentes || os.produtos || [];
        preencherTabelaPecas(listaPecas);

        // 8. Valores Financeiros (Mão de Obra e Total)
        const valorMaoObraNum = Number(os.valorMaoObra || os.maoDeObra || os.mao_de_obra || 0);
        const lblMaoObra = document.getElementById('lbl-mao-obra');
        if (lblMaoObra) lblMaoObra.textContent = valorMaoObraNum.toFixed(2);

        const valorTotalNum = Number(os.valorTotal || os.valor_total || 0);
        const campoValorTotal = document.getElementById('valorTotal');
        if (campoValorTotal) campoValorTotal.value = valorTotalNum.toFixed(2);

    } catch (err) {
        console.error('Erro ao carregar OS:', err);
        alert('Erro ao buscar as informações da Ordem de Serviço.');
    }
});

// Função auxiliar para formatar datas
function formatarData(dataString) {
    if (!dataString) return '---';
    if (dataString.includes('/') && dataString.length === 10) return dataString;
    
    const partesData = dataString.split('T')[0].split('-');
    if (partesData.length === 3) {
        return `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
    }
    return dataString;
}

// Função para renderizar a tabela de peças
function preencherTabelaPecas(pecas) {
    const tbody = document.getElementById('pdf-tabela-pecas');
    if (!tbody) return;

    if (!pecas || pecas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted text-center">Nenhuma peça informada.</td></tr>`;
        return;
    }

    let html = '';
    pecas.forEach(p => {
        const descricao = p.descricao || p.nome || p.peca || '---';
        const qtd = Number(p.quantidade || p.qtd || p.qtde || 1);
        const vlrUnit = Number(p.vlrUnit || p.valorUnitario || p.valor_unitario || p.preco || 0);
        
        const subtotal = p.subtotal ? Number(p.subtotal) : (qtd * vlrUnit);

        html += `
            <tr>
                <td class="text-start">${descricao}</td>
                <td>${qtd}</td>
                <td class="text-end">R$ ${vlrUnit.toFixed(2)}</td>
                <td class="text-end">R$ ${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// 9. Funcionalidade de Gerar PDF
const btnGerarPdf = document.getElementById('btnGerarPdf');
if (btnGerarPdf) {
    btnGerarPdf.addEventListener('click', () => {
        const elemento = document.querySelector('.card');

        const opcoes = {
            margin:       [5, 5, 5, 5],
            filename:     `Ordem_Servico_${document.getElementById('numeroOS').textContent || 'OS'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true,
                scrollY: 0 
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        elemento.classList.add('modo-impressao-pdf');

        html2pdf().from(elemento).set(opcoes).save().then(() => {
            elemento.classList.remove('modo-impressao-pdf');
        });
    });
}

// 10. Funcionalidade de Enviar WhatsApp simples
const btnWhatsApp = document.getElementById('btnWhatsApp');
if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', () => {
        const numeroOS = document.getElementById('numeroOS').textContent || '---';
        const nomeCliente = document.getElementById('lbl-cliente').textContent || 'Cliente';
        const celularBruto = document.getElementById('lbl-celular').textContent || '';
        
        const celular = celularBruto.replace(/\D/g, '');

        if (!celular) {
            alert('Número de celular do cliente não encontrado!');
            return;
        }

        const mensagem = `Olá ${nomeCliente}, segue os detalhes do Orçamento / Ordem de Serviço N.º ${numeroOS}.`;
        const link = `https://api.whatsapp.com/send?phone=55${celular}&text=${encodeURIComponent(mensagem)}`;
        
        window.open(link, '_blank');
    });
}

// 11. Funcionalidade de Enviar Orçamento Completo via WhatsApp
const btnEnviarOrcamento = document.getElementById('btnEnviarOrcamento');
if (btnEnviarOrcamento) {
    btnEnviarOrcamento.addEventListener('click', () => {
        const nomeEmpresa = "Rocha Solidez";
        const numeroOS = document.getElementById('numeroOS').textContent || '---';
        const nomeCliente = document.getElementById('lbl-cliente').textContent || 'Cliente';
        const cidadeCliente = document.getElementById('lbl-cidade').textContent || '---';
        const celularBruto = document.getElementById('lbl-celular').textContent || '';
        const celular = celularBruto.replace(/\D/g, '');

        if (!celular) {
            alert('Número de celular do cliente não encontrado!');
            return;
        }

        const equipamento = document.getElementById('equipamento').value || 'Não informado';
        const marcaModelo = document.getElementById('marcaModelo').value || 'Não informado';
        const numSerie = document.getElementById('lbl-serie').textContent || 'Não informado';
        const patrimonio = document.getElementById('lbl-patrimonio').textContent || 'Não informado';

        const dataEntrada = document.getElementById('lbl-data-entrada').textContent || '---';
        const dataSaida = document.getElementById('lbl-data-saida').textContent || '---';
        const garantia = document.getElementById('lbl-garantia').textContent || 'Não informado';
        const garantiaAnt = document.getElementById('lbl-garantia-servico-anterior')?.textContent || 'Não';
        const garantiaComp = document.getElementById('lbl-garantia-compra')?.textContent || 'Não';

        const defeito = document.getElementById('defeito').value || 'Não informado';
        const servicoRealizar = document.getElementById('servicoRealizar').value || 'Não informado';
        const situacao = document.getElementById('situacao').value || 'Aguardando';

        let textoPecas = '';
        const linhasTabela = document.querySelectorAll('#pdf-tabela-pecas tr');
        
        linhasTabela.forEach(linha => {
            const colunas = linha.querySelectorAll('td');
            if (colunas.length === 4) {
                const desc = colunas[0].textContent.trim();
                const qtd = colunas[1].textContent.trim();
                const vlrUnit = colunas[2].textContent.trim();
                const subtotal = colunas[3].textContent.trim();
                
                if (desc !== 'Nenhuma peça informada.') {
                    textoPecas += `• ${desc} | Qtd: ${qtd} x ${vlrUnit} = ${subtotal}\n`;
                }
            }
        });
        
        if (!textoPecas) {
            textoPecas = '• Nenhuma peça informada.\n';
        }

        const maoObra = document.getElementById('lbl-mao-obra').textContent || '0.00';
        const valorTotal = document.getElementById('valorTotal').value || '0.00';

        let mensagem = `Olá *${nomeCliente}*, aqui é da *${nomeEmpresa}*!\n`;
        mensagem += `Seguem os dados completos do seu Orçamento/Ordem de Serviço:\n\n`;

        mensagem += `📋 *DADOS DO CLIENTE*\n`;
        mensagem += `• *Cliente:* ${nomeCliente} (${cidadeCliente})\n`;
        mensagem += `• *Número da OS:* ${numeroOS}\n\n`;

        mensagem += `💻 *DADOS DO EQUIPAMENTO*\n`;
        mensagem += `• *Equipamento:* ${equipamento}\n`;
        mensagem += `• *Marca / Modelo:* ${marcaModelo}\n`;
        mensagem += `• *Nº de Série:* ${numSerie}\n`;
        mensagem += `• *Patrimônio:* ${patrimonio}\n\n`;

        mensagem += `📅 *DATAS E GARANTIA*\n`;
        mensagem += `• *Data de Entrada:* ${dataEntrada}\n`;
        mensagem += `• *Data de Saída / Previsão:* ${dataSaida}\n`;
        mensagem += `• *Tempo de Garantia:* ${garantia}\n`;
        mensagem += `• *Garantia Serviço Anterior:* ${garantiaAnt}\n`;
        mensagem += `• *Garantia de Compra:* ${garantiaComp}\n\n`;

        mensagem += `🔍 *DIAGNÓSTICO E SERVIÇO*\n`;
        mensagem += `• *Defeito / Relato:* ${defeito}\n`;
        mensagem += `• *Serviço a Realizar / Obs:* ${servicoRealizar}\n`;
        mensagem += `• *Situação:* ${situacao}\n\n`;

        mensagem += `🛠️ *PEÇAS / COMPONENTES*\n`;
        mensagem += textoPecas + `\n`;

        mensagem += `💰 *VALORES E TOTAL*\n`;
        mensagem += `• *Mão de Obra:* R$ ${maoObra}\n`;
        mensagem += `• *VALOR TOTAL ESTIMADO:* R$ ${valorTotal}\n\n`;

        mensagem += `Fico no aguardo de sua aprovação!`;

        const link = `https://api.whatsapp.com/send?phone=55${celular}&text=${encodeURIComponent(mensagem)}`;
        window.open(link, '_blank');
    });
}

// 12. Funcionalidade de Salvar Alterações (Utiliza a variável global osIdGlobal)
// 12. Funcionalidade de Salvar Alterações (Utiliza a variável global osIdGlobal)
const btnSalvar = document.getElementById('btnSalvar');
if (btnSalvar) {
    btnSalvar.addEventListener('click', async (e) => {
        e.preventDefault(); // Impede o recarregamento da página e evita múltiplos disparos

        if (!osIdGlobal) {
            alert('ID da Ordem de Serviço não encontrado!');
            return;
        }

        const equipamento = document.getElementById('equipamento')?.value || '';
        const marcaModelo = document.getElementById('marcaModelo')?.value || '';
        const numeroSerie = document.getElementById('lbl-serie')?.textContent !== '---' ? document.getElementById('lbl-serie')?.textContent : '';
        const patrimonio = document.getElementById('lbl-patrimonio')?.textContent !== '---' ? document.getElementById('lbl-patrimonio')?.textContent : '';
        
        const dataEntrada = document.getElementById('lbl-data-entrada')?.textContent || '';
        const dataSaida = document.getElementById('lbl-data-saida')?.textContent || '';
        const tempoGarantia = document.getElementById('lbl-garantia')?.textContent.replace(/\D/g, '') || '';
        
        const garantiaServicoAnterior = document.getElementById('lbl-garantia-servico-anterior')?.textContent === 'Sim';
        const garantiaCompra = document.getElementById('lbl-garantia-compra')?.textContent === 'Sim';
        
        const defeito = document.getElementById('defeito')?.value || '';
        const servicoRealizar = document.getElementById('servicoRealizar')?.value || '';
        const situacao = document.getElementById('situacao')?.value || 'Aguardando';
        
        const valorMaoObra = parseFloat(document.getElementById('lbl-mao-obra')?.textContent) || 0;
        const valorTotal = parseFloat(document.getElementById('valorTotal')?.value) || 0;

        const pecas = [];
        const linhasTabela = document.querySelectorAll('#pdf-tabela-pecas tr');
        linhasTabela.forEach(linha => {
            const colunas = linha.querySelectorAll('td');
            if (colunas.length === 4) {
                const descricao = colunas[0].textContent.trim();
                const quantidade = parseInt(colunas[1].textContent.trim()) || 1;
                const vlrUnitText = colunas[2].textContent.replace('R$', '').trim().replace(',', '.');
                const vlrUnit = parseFloat(vlrUnitText) || 0;

                if (descricao && descricao !== 'Nenhuma peça informada.') {
                    pecas.push({
                        descricao: descricao,
                        quantidade: quantidade,
                        vlrUnit: vlrUnit,
                        subtotal: quantidade * vlrUnit
                    });
                }
            }
        });

        const dadosAtualizados = {
            equipamento,
            marcaModelo,
            numeroSerie,
            patrimonio,
            dataEntrada,
            dataSaida,
            tempoGarantia,
            garantiaServicoAnterior,
            garantiaCompra,
            defeito,
            servicoRealizar,
            situacao,
            pecas,
            valorMaoObra,
            valorTotal
        };

        try {
            const resposta = await fetch(`/atualizar_os/${osIdGlobal}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosAtualizados)
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                alert('Ordem de Serviço salva com sucesso!');
            } else {
                alert(`Erro ao salvar: ${resultado.mensagem || 'Erro desconhecido'}`);
            }
        } catch (erro) {
            console.error('Erro na requisição de salvamento:', erro);
            alert('Erro de conexão ao tentar salvar a Ordem de Serviço.');
        }
    });
}