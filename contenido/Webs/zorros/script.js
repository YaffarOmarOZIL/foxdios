const datos = [
  'A fox uses its bushy tail as a warm blanket when it sleeps.',
  'Baby foxes are called kits.',
  'Fennec foxes have huge ears to stay cool in the desert.',
  'Foxes can make more than 40 different sounds.',
  'Arctic foxes change the color of their fur with the seasons.',
  'Foxes have whiskers on their legs, not only on their face.',
];
const texto = document.getElementById('texto');
document.getElementById('dato').addEventListener('click', () => {
  texto.textContent = '🦊 ' + datos[Math.floor(Math.random() * datos.length)];
  texto.classList.remove('aparece');
  void texto.offsetWidth;
  texto.classList.add('aparece');
});
