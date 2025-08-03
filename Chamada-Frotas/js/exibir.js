const apiUrl = "http://localhost:3001/frotas";

window.onload = function () {
  exibirFrotasChamadas();
  atualizarRelogio();
  setInterval(exibirFrotasChamadas, 5000);
  setInterval(atualizarRelogio, 1000);
};

function exibirFrotasChamadas() {
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      const chamadas = data
        .filter(f => f.status === "carregando")
        .sort((a, b) => new Date(b.chamada_em) - new Date(a.chamada_em));

      const ultimaFrota = chamadas[0];
      const restantes = chamadas.slice(1, 10); // lista com até 9 anteriores

      // Atualizar destaque
      const destaqueDiv = document.getElementById("destaque-chamada");
      if (ultimaFrota) {
        destaqueDiv.innerHTML = `
          <div class="text-8xl font-extrabold text-blue-800 pulse-frota">${ultimaFrota.frota}</div>
          <div class="text-xl text-gray-700 mt-2">Rampa ${ultimaFrota.rampa} • Box ${ultimaFrota.box}</div>
          <div class="text-sm text-gray-500 mt-2">Viagem ${ultimaFrota.viagem} • ⏱️ ${calcularTempoDecorrido(ultimaFrota.chamada_em)}</div>
          <div class="text-xl text-blue-500 mt-5">Dirigir-se ao carregamento</div>
        `;
      } else {
        destaqueDiv.innerHTML = `<p class="text-gray-600">Nenhuma frota em carregamento no momento.</p>`;
      }

      // Atualizar lista
      const listaDiv = document.getElementById("lista-chamadas");
      listaDiv.innerHTML = "";
      restantes.forEach(f => {
        const item = document.createElement("div");
        item.className = "p-3 border-b text-sm text-gray-800";
        item.innerHTML = `<strong>${f.frota}</strong> | Rampa ${f.rampa} • Box ${f.box} • ⏱️ ${calcularTempoDecorrido(f.chamada_em)}`;
        listaDiv.appendChild(item);
      });
    });
}

function calcularTempoDecorrido(dataChamada) {
  const chamada = new Date(dataChamada);
  const agora = new Date();
  const diff = agora - chamada;
  const minutos = Math.floor(diff / 60000);
  const segundos = Math.floor((diff % 60000) / 1000);
  return `${minutos}min ${segundos < 10 ? "0" : ""}${segundos}s`;
}

function atualizarRelogio() {
  const agora = new Date();
  const hora = agora.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const data = agora.toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  document.getElementById("hora").textContent = hora;
  document.getElementById("data").textContent = data.charAt(0).toUpperCase() + data.slice(1);
}
