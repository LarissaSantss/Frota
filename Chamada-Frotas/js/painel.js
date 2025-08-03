const apiUrl = "http://localhost:3001/frotas";

window.onload = function () {
  carregarDisponibilidade();
  setInterval(carregarDisponibilidade, 5000); // Atualiza a cada 5s
};

function carregarDisponibilidade() {
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      const ocupados = data.filter(f => f.status === "carregando");

      const rampas = [];
      const boxes = [];

      // Inicializa 24 rampas e boxes como "livre"
      for (let i = 1; i <= 24; i++) {
        rampas.push({ numero: i, status: "livre", frota: null });
        boxes.push({ numero: i, status: "livre", frota: null });
      }

      // Marca rampas e boxes como ocupados com info de frota
      ocupados.forEach(f => {
        const info = `${f.frota} | Rampa: ${f.rampa} | Box: ${f.box} | Viagem: ${f.viagem}`;

        const rampaIndex = rampas.findIndex(r => r.numero == f.rampa);
        if (rampaIndex !== -1) {
          rampas[rampaIndex].status = "ocupado";
          rampas[rampaIndex].frota = info;
        }

        const boxIndex = boxes.findIndex(b => b.numero == f.box);
        if (boxIndex !== -1) {
          boxes[boxIndex].status = "ocupado";
          boxes[boxIndex].frota = info;
        }
      });

      atualizarTabela("tabela-rampas", rampas);
      atualizarTabela("tabela-boxes", boxes);

      // Atualiza os contadores visuais
      document.getElementById("rampa-livres").innerText = rampas.filter(r => r.status === "livre").length;
      document.getElementById("rampa-ocupadas").innerText = rampas.filter(r => r.status === "ocupado").length;

      document.getElementById("box-livres").innerText = boxes.filter(b => b.status === "livre").length;
      document.getElementById("box-ocupados").innerText = boxes.filter(b => b.status === "ocupado").length;
    });
}

function atualizarTabela(tabelaId, itens) {
  const tbody = document.getElementById(tabelaId);
  tbody.innerHTML = "";

  itens.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = item.status === "ocupado" ? "bg-red-50" : "bg-green-50";

    tr.innerHTML = `
      <td class="border px-2 py-1 font-semibold">${item.numero}</td>
      <td class="border px-2 py-1">${item.status === "ocupado" ? "🔴 Ocupado" : "🟢 Livre"}</td>
      <td class="border px-2 py-1 text-gray-700">${item.frota ?? "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}
