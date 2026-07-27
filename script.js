const API_URL = 'https://sheetdb.io/api/v1/ddpoqimpulr8g';

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getDataAtual() {
    return new Date().toLocaleString('pt-BR');
}

async function getAllData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erro ao buscar dados');
        return await response.json();
    } catch (error) {
        console.error(error);
        alert('Erro ao conectar com a planilha. Verifique a URL do SheetDB.');
        return [];
    }
}

async function createItem(item) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([item])
        });
        if (!response.ok) throw new Error('Erro ao criar');
        return true;
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar. Tente novamente.');
        return false;
    }
}

async function updateItem(id, data) {
    try {
        const response = await fetch(API_URL + '/id/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erro ao atualizar');
        return true;
    } catch (error) {
        console.error(error);
        alert('Erro ao atualizar. Tente novamente.');
        return false;
    }
}

async function deleteItem(id) {
    try {
        const response = await fetch(API_URL + '/id/' + id, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erro ao remover');
        return true;
    } catch (error) {
        console.error(error);
        alert('Erro ao remover. Tente novamente.');
        return false;
    }
}

async function renderCorredores() {
    const container = document.getElementById('corredoresGrupos');
    if (!container) return;

    const dados = await getAllData();
    const corredoresComItens = {};

    dados.forEach(function(item) {
        const c = String(item.corredor);
        corredoresComItens[c] = true;
    });

    let html = '';

    for (let inicio = 1; inicio <= 60; inicio += 10) {
        const fim = Math.min(inicio + 9, 60);
        html += '<div class="grupo"><h3>Corredores ' + inicio + ' a ' + fim + '</h3><div class="botoes-corredor">';

        for (let i = inicio; i <= fim; i++) {
            const temItens = corredoresComItens[String(i)];
            const classe = temItens ? 'has-items' : '';
            html += '<a href="corredor.html?id=' + i + '" class="' + classe + '">' + i + '</a>';
        }

        html += '</div></div>';
    }

    container.innerHTML = html;
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    const btn = document.getElementById('searchBtn');
    const resultsBox = document.getElementById('searchResults');
    const corredoresSection = document.getElementById('corredoresSection');

    if (!input || !btn) return;

    async function executarBusca() {
        const termo = input.value.trim().toLowerCase();
        if (!termo) {
            resultsBox.classList.add('hidden');
            corredoresSection.classList.remove('hidden');
            return;
        }

        if (/^\d+$/.test(termo)) {
            const num = parseInt(termo, 10);
            if (num >= 1 && num <= 60) {
                window.location.href = 'corredor.html?id=' + num;
                return;
            }
        }

        const dados = await getAllData();
        const resultados = [];

        dados.forEach(function(item) {
            if (item.nome && item.nome.toLowerCase().includes(termo)) {
                resultados.push(item);
            }
        });

        resultados.sort(function(a, b) {
            return Number(a.corredor) - Number(b.corredor);
        });

        if (resultados.length === 0) {
            resultsBox.innerHTML = '<h3>Nenhum resultado para "' + input.value + '"</h3>';
        } else {
            let html = '<h3>Resultados para "' + input.value + '" (' + resultados.length + ')</h3>';
            resultados.forEach(function(r) {
                html += '<div class="result-item"><div class="info"><div class="nome">' + r.nome + '</div><div class="corredor-tag">Corredor ' + r.corredor + '</div><div class="qtd">' + r.quantidade + ' palete' + (Number(r.quantidade) > 1 ? 's' : '') + '</div></div><a href="corredor.html?id=' + r.corredor + '">Abrir</a></div>';
            });
            resultsBox.innerHTML = html;
        }

        resultsBox.classList.remove('hidden');
        corredoresSection.classList.add('hidden');
    }

    btn.addEventListener('click', executarBusca);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') executarBusca();
    });

    input.addEventListener('input', function() {
        if (input.value.trim() === '') {
            resultsBox.classList.add('hidden');
            corredoresSection.classList.remove('hidden');
        }
    });
}

let corredorAtual = null;
let editandoId = null;

function initCorredorPage() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);

    if (!id || isNaN(id) || id < 1 || id > 60) {
        window.location.href = 'index.html';
        return;
    }

    corredorAtual = id;
    document.getElementById('tituloCorredor').textContent = 'Corredor ' + id;
    document.title = 'Corredor ' + id + ' - Falange';

    renderLista();
    setupFormulario();
}

async function renderLista() {
    const dados = await getAllData();
    const lista = dados.filter(function(item) {
        return String(item.corredor) === String(corredorAtual);
    });

    const container = document.getElementById('listaMercadorias');
    const msgVazio = document.getElementById('msgVazio');

    if (lista.length === 0) {
        container.innerHTML = '';
        msgVazio.classList.remove('hidden');
        return;
    }

    msgVazio.classList.add('hidden');

    let html = '';
    lista.forEach(function(item) {
        html += '<div class="item-card"><div class="info"><div class="nome">' + item.nome + '</div><div class="qtd">' + item.quantidade + ' palete' + (Number(item.quantidade) > 1 ? 's' : '') + '</div></div><div class="item-actions"><button class="btn-edit" onclick="editarItem(\'' + item.id + '\')">✍🏻</button><button class="btn-move" onclick="moverItem(\'' + item.id + '\')">🔄</button><button class="btn-delete" onclick="removerItem(\'' + item.id + '\')">🗑️</button></div></div>';
    });

    container.innerHTML = html;
}

function setupFormulario() {
    const btnAdicionar = document.getElementById('btnAdicionar');
    const formBox = document.getElementById('formBox');
    const btnSalvar = document.getElementById('btnSalvar');
    const btnCancelar = document.getElementById('btnCancelar');
    const inputNome = document.getElementById('inputNome');
    const inputQtd = document.getElementById('inputQtd');
    const formTitle = document.getElementById('formTitle');

    btnAdicionar.addEventListener('click', function() {
        editandoId = null;
        formTitle.textContent = 'Nova mercadoria';
        inputNome.value = '';
        inputQtd.value = '1';
        formBox.classList.remove('hidden');
        inputNome.focus();
    });

    btnCancelar.addEventListener('click', function() {
        formBox.classList.add('hidden');
        editandoId = null;
    });

    btnSalvar.addEventListener('click', async function() {
        const nome = inputNome.value.trim();
        const qtd = parseInt(inputQtd.value, 10) || 1;

        if (!nome) {
            alert('Digite o nome da mercadoria');
            inputNome.focus();
            return;
        }

        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        if (editandoId) {
            const sucesso = await updateItem(editandoId, {
                nome: nome,
                quantidade: qtd,
                atualizado_em: getDataAtual()
            });
            if (sucesso) {
                formBox.classList.add('hidden');
                editandoId = null;
                await renderLista();
            }
        } else {
            const novoItem = {
                id: gerarId(),
                corredor: String(corredorAtual),
                nome: nome,
                quantidade: qtd,
                atualizado_em: getDataAtual()
            };
            const sucesso = await createItem(novoItem);
            if (sucesso) {
                formBox.classList.add('hidden');
                await renderLista();
            }
        }

        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Aceitar';
    });
}

async function editarItem(id) {
    const dados = await getAllData();
    const item = dados.find(function(i) { return i.id === id; });
    if (!item) return;

    editandoId = id;
    document.getElementById('formTitle').textContent = 'Editar mercadoria';
    document.getElementById('inputNome').value = item.nome;
    document.getElementById('inputQtd').value = item.quantidade;
    document.getElementById('formBox').classList.remove('hidden');
    document.getElementById('inputNome').focus();
}

async function removerItem(id) {
    if (!confirm('Remover esta mercadoria?')) return;

    const sucesso = await deleteItem(id);
    if (sucesso) {
        await renderLista();
    }
}

async function moverItem(id) {
    const novoCorredor = prompt('Para qual corredor deseja mover esta mercadoria? (1 a 60)');
    
    if (!novoCorredor) return;

    const destino = parseInt(novoCorredor, 10);

    if (isNaN(destino) || destino < 1 || destino > 60) {
        alert('Número de corredor inválido. Digite um número de 1 a 60.');
        return;
    }

    if (destino == corredorAtual) {
        alert('A mercadoria já está neste corredor.');
        return;
    }

    const sucesso = await updateItem(id, {
        corredor: String(destino),
        atualizado_em: getDataAtual()
    });

    if (sucesso) {
        await renderLista();
        alert('Mercadoria movida para o Corredor ' + destino + ' com sucesso!');
    }
}
