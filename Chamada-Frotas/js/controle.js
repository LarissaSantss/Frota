const apiUrl = "http://localhost:3001/frotas";

// Ao carregar a página
window.onload = function () {
  carregarFrotas();
  setInterval(carregarFrotas, 5000); // Atualiza a cada 5s
};

function atualizarDataHora() {
    const agora = new Date();
  
    const hora = agora.getHours().toString().padStart(2, "0");
    const minutos = agora.getMinutes().toString().padStart(2, "0");
    const segundos = agora.getSeconds().toString().padStart(2, "0");
    const horaFormatada = `${hora}:${minutos}:${segundos}`;
    document.getElementById("hora-atual").textContent = horaFormatada;
  
    const opcoesData = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
    const dataFormatada = agora.toLocaleDateString("pt-BR", opcoesData);
    document.getElementById("data-atual").textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  }
  
  setInterval(atualizarDataHora, 1000);
  atualizarDataHora(); // executar logo ao abrir a página
  

// Cadastrar nova frota
function cadastrarFrota() {
    const frota = document.getElementById("frota").value.trim();
    const rampa = document.getElementById("rampa").value.trim();
    const box = document.getElementById("box").value.trim();
    const viagem = document.getElementById("viagem").value.trim();
    const status = document.getElementById("status").value;
  
    if (!frota || !rampa || !box || !viagem || !status) {
      alert("Preencha todos os campos!");
      return;
    }
  
    // Validação para status "carregando": rampa e box devem ser números entre 1 e 24
    if (status === "carregando") {
      const numRampa = parseInt(rampa);
      const numBox = parseInt(box);
  
      if (isNaN(numRampa) || numRampa < 1 || numRampa > 24) {
        alert("Informe um número de rampa válido (1 a 24).");
        return;
      }
  
      if (isNaN(numBox) || numBox < 1 || numBox > 24) {
        alert("Informe um número de box válido (1 a 24).");
        return;
      }
    }
  
    const novaFrota = {
        frota,
        rampa,
        box,
        viagem,
        status,
        cadastrada_em: new Date(), // <-- aqui
        chamada_em: status === "carregando" ? new Date() : null,
        foi_rechamada: false
      };
      
  
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaFrota)
    })
      .then(() => {
        limparCampos();
        carregarFrotas();
      });
  }
  

function limparCampos() {
  document.getElementById("frota").value = "";
  document.getElementById("rampa").value = "";
  document.getElementById("box").value = "";
  document.getElementById("viagem").value = "";
  document.getElementById("status").value = "em_espera";
}

function carregarFrotas() {
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      const statusContainers = {
        em_espera: document.getElementById("frotasEmEspera"),
        carregando: document.getElementById("frotasChamadas"),
        rechamada: document.getElementById("rechamada"),
        finalizada: document.getElementById("finalizada"),
        arquivada: document.getElementById("arquivada")
      };

      const contadores = {
        em_espera: 0,
        carregando: 0,
        rechamada: 0,
        finalizada: 0,
        arquivada: 0
      };

      Object.values(statusContainers).forEach(container => container.innerHTML = "");

      const limites = {
        em_espera: [],
        carregando: [],
        rechamada: [],
        finalizada: [],
        arquivada: []
      };

      const frotasOrdenadas = data.sort((a, b) => new Date(b.chamada_em) - new Date(a.chamada_em));

      frotasOrdenadas.forEach((f) => {
        const card = document.createElement("div");
        card.className = "p-4 bg-gray-50 rounded shadow text-sm mb-2";

        let cronometro = "";
        if (f.status === "carregando" && f.chamada_em) {
          const tempo = calcularTempoDecorrido(f.chamada_em);
          cronometro = `<div class="text-xs text-gray-600 mt-1">⏱️ ${tempo}</div>`;
        } else if (f.status === "em_espera" && f.cadastrada_em) {
          const tempo = calcularTempoDecorrido(f.cadastrada_em);
          cronometro = `<div class="text-xs text-gray-600 mt-1">⌛ Esperando há ${tempo}</div>`;
        }
        

        card.innerHTML = `
          <div><strong>${f.frota}</strong> | Rampa: ${f.rampa} | Box: ${f.box} | Viagem: ${f.viagem}</div>
          <div>Status: <span class="uppercase font-semibold">${f.status.replace("_", " ")}</span></div>
          ${cronometro}
          <div class='mt-2 space-x-2'>
            ${f.status === "em_espera" ? `<button onclick="chamarFrota('${f.id}')" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Chamar</button>` : ""}
            ${f.status === "carregando" ? `
              <button onclick="rechamarFrota('${f.id}')" class="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Rechamar</button>
              <button onclick="finalizarFrota('${f.id}')" class="bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800">Finalizar</button>` : ""}
            ${f.status === "arquivada" ? `<button onclick="restaurarFrota('${f.id}')" class="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600">Restaurar</button>` :
              `<button onclick="arquivarFrota('${f.id}')" class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Arquivar</button>`}
          </div>
        `;

        // Exibir corretamente por status
        if (f.status === "em_espera") {
          limites.em_espera.push(card);
          contadores.em_espera++;
        }
        if (f.status === "carregando") {
          limites.carregando.push(card);
          contadores.carregando++;

          if (f.foi_rechamada) {
            const clone = card.cloneNode(true);
            limites.rechamada.push(clone);
            contadores.rechamada++;
          }
        }
        if (f.status === "finalizada") {
          limites.finalizada.push(card);
          contadores.finalizada++;
        }
        if (f.status === "arquivada") {
          limites.arquivada.push(card);
          contadores.arquivada++;
        }
      });

      Object.keys(limites).forEach(status => {
        const cards = limites[status];
        const container = statusContainers[status];

        cards.forEach((card, i) => {
          if (i < 5) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
          container.appendChild(card);
        });

        if (cards.length > 5) {
          const botao = document.createElement("button");
          botao.textContent = "Mostrar mais";
          botao.className = "mt-2 text-blue-600 underline text-sm hover:text-blue-800";
          botao.onclick = () => {
            cards.forEach(c => c.style.display = "block");
            botao.remove();
          };
          container.appendChild(botao);
        }
      });

      // Atualiza contadores visuais
      document.getElementById("contador-em_espera").textContent = `🟡 Em Espera: ${contadores.em_espera}`;
      document.getElementById("contador-carregando").textContent = `🟢 Carregando: ${contadores.carregando}`;
      document.getElementById("contador-rechamada").textContent = `🔄 Rechamada: ${contadores.rechamada}`;
      document.getElementById("contador-finalizada").textContent = `✅ Finalizadas: ${contadores.finalizada}`;
      document.getElementById("contador-arquivada").textContent = `📦 Arquivadas: ${contadores.arquivada}`;
    });
}

// Ações de botão
function chamarFrota(id) {
  fetch(`${apiUrl}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "carregando", chamada_em: new Date(), foi_rechamada: false })
  }).then(() => carregarFrotas());
}

function rechamarFrota(id) {
  fetch(`${apiUrl}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chamada_em: new Date(), foi_rechamada: true })
  }).then(() => carregarFrotas());
}

function arquivarFrota(id) {
  fetch(`${apiUrl}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "arquivada" })
  }).then(() => carregarFrotas());
}

function restaurarFrota(id) {
  fetch(`${apiUrl}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "em_espera", chamada_em: null, foi_rechamada: false })
  }).then(() => carregarFrotas());
}

function finalizarFrota(id) {
  fetch(`${apiUrl}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "finalizada" })
  }).then(() => carregarFrotas());
}

function calcularTempoDecorrido(dataChamada) {
  const chamada = new Date(dataChamada);
  const agora = new Date();
  const diff = agora - chamada;
  const minutos = Math.floor(diff / 60000);
  const segundos = Math.floor((diff % 60000) / 1000);
  return `${minutos}min ${segundos < 10 ? "0" : ""}${segundos}s`;
}
