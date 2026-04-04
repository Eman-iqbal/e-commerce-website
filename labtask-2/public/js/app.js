function toggleMenu() {
  var menu = document.getElementById('navMenu');
  var btn = document.getElementById('hamburgerBtn');

  if (menu.classList.contains('open')) {
    menu.classList.remove('open');
    btn.textContent = '☰';
  } else {
    menu.classList.add('open');
    btn.textContent = '✕';
  }
}

var menuLinks = document.querySelectorAll('.nav-menu li a');
menuLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    var menu = document.getElementById('navMenu');
    var btn = document.getElementById('hamburgerBtn');
    menu.classList.remove('open');
    btn.textContent = '☰';
  });
});

window.addEventListener('resize', function () {
  if (window.innerWidth > 768) {
    var menu = document.getElementById('navMenu');
    var btn = document.getElementById('hamburgerBtn');
    menu.classList.remove('open');
    btn.textContent = '☰';
  }
});