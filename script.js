/* ============================================================
   Portfolio de Adán Giménez — JavaScript

   Todo lo interactivo de la página está aquí: el menú del móvil,
   la barra de progreso, las animaciones al hacer scroll, el texto
   que se escribe solo y la lista de proyectos que se descarga de
   GitHub.

   El archivo se carga al final del <body>, así que cuando se
   ejecuta el HTML ya existe y podemos buscar elementos sin
   esperar a ningún evento.
   ============================================================ */

/* En el sistema operativo se puede activar una opción de accesibilidad
   llamada "reducir movimiento", pensada para gente a la que las
   animaciones le marean. matchMedia nos deja consultarla desde JS.
   Guardamos el resultado una vez y lo reutilizamos en toda la página. */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ---------- El año del pie de página ----------
   En el HTML hay un <span id="year"> vacío. Lo rellenamos desde aquí
   para no tener que acordarnos de cambiarlo cada 1 de enero. */
const yearEl = document.querySelector("#year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


/* ---------- Menú del móvil ----------
   En pantallas pequeñas el menú se esconde detrás del botón de las
   tres rayas. Aquí se abre y se cierra. */
const menuToggle = document.querySelector("#menuToggle");
const nav = document.querySelector("#nav");

/* Comprobamos que los dos elementos existen antes de usarlos. Si por lo
   que sea faltaran en el HTML, el resto del archivo seguiría funcionando
   en vez de romperse con un error. */
if (menuToggle && nav) {

  /* Una sola función que deja el menú en el estado que le pidamos.
     Es más fácil de mantener que tener el código de abrir por un lado
     y el de cerrar por otro. */
  const setMenu = (open) => {
    // La clase is-open es la que el CSS usa para mostrar el menú
    nav.classList.toggle("is-open", open);

    // aria-expanded le dice a los lectores de pantalla si está abierto
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");

    // Con el menú abierto bloqueamos el scroll del fondo, que si no
    // se mueve la página por detrás mientras navegas por el menú
    document.body.style.overflow = open ? "hidden" : "";
  };

  // El botón alterna: si está abierto lo cierra y al revés
  menuToggle.addEventListener("click", () => {
    setMenu(!nav.classList.contains("is-open"));
  });

  /* Al pulsar un enlace cerramos el menú. Fíjate que el listener está
     puesto en el <nav> entero y no en cada enlace: como el clic "sube"
     desde el enlace hasta su padre, con uno solo nos vale. Esto se llama
     delegación de eventos.
     closest("a") mira si lo que se ha pulsado es un enlace o algo que
     está dentro de un enlace. */
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  // La tecla Escape también lo cierra, que es lo que uno espera
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) setMenu(false);
  });
}


/* ---------- Cosas que dependen de cuánto has bajado ----------
   Tres detalles a la vez: la barrita de progreso de arriba, la cabecera
   que se compacta al bajar y el botón de volver arriba. */
const progressBar = document.querySelector("#progressBar");
const topbar = document.querySelector("#topbar");
const toTop = document.querySelector("#toTop");

const onScroll = () => {
  const scrolled = window.scrollY;                                        // píxeles bajados
  const max = document.documentElement.scrollHeight - window.innerHeight; // total que se puede bajar

  /* Regla de tres para saber qué porcentaje llevas leído.
     El "max > 0" evita dividir entre cero en páginas tan cortas que
     no se pueden desplazar. */
  if (progressBar) {
    progressBar.style.width = `${max > 0 ? (scrolled / max) * 100 : 0}%`;
  }

  // A partir de 20px la cabecera se pone opaca y se hace más estrecha
  if (topbar) {
    topbar.classList.toggle("is-stuck", scrolled > 20);
  }

  // El botón de subir no aparece hasta que hay algo de recorrido hecho
  if (toTop) {
    toTop.classList.toggle("is-visible", scrolled > 500);
  }
};

/* El evento scroll se dispara muchísimas veces por segundo. Si hiciéramos
   los cálculos en todas, la página iría a tirones.
   Con este truco solo trabajamos una vez por fotograma:
   requestAnimationFrame llama a la función justo antes de que el navegador
   dibuje, y mientras tanto la bandera "ticking" ignora el resto de avisos.

   El { passive: true } del final le promete al navegador que no vamos a
   cancelar el scroll, y así puede desplazar la página sin esperarnos. */
let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
  },
  { passive: true }
);

/* La llamamos una vez al cargar, porque si recargas la página estando a
   media altura el navegador no dispara ningún scroll y todo se quedaría
   como si estuvieras arriba del todo. */
onScroll();

if (toTop) {
  toTop.addEventListener("click", () => {
    // Sube suave, salvo que el usuario haya pedido menos movimiento
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}


/* ---------- Que los bloques aparezcan al llegar a ellos ----------
   Todo lo que en el HTML lleva class="reveal" empieza transparente y
   se muestra cuando entra en pantalla. */
const revealItems = document.querySelectorAll(".reveal");

// Mostrarlo todo de golpe. Lo usamos en varios sitios, así que va aparte.
const revealAll = () => revealItems.forEach((item) => item.classList.add("is-visible"));

/* IntersectionObserver es la herramienta del navegador para enterarse de
   cuándo un elemento entra o sale de la pantalla. Antes esto se hacía
   calculando posiciones en cada scroll, que era mucho más lento.

   El "in window" comprueba que el navegador lo soporte; si es muy antiguo
   y no lo tiene, nos vamos al else y enseñamos todo sin animación. */
if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      // entries son los elementos cuya visibilidad acaba de cambiar
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return; // este va saliendo, no entrando

        /* Si entran cuatro tarjetas a la vez, aparecen escalonadas y queda
           más natural que todas de golpe. Pero poco: pasado un cuarto de
           segundo deja de parecer un detalle y parece que la web va lenta. */
        entry.target.style.transitionDelay = `${Math.min(index * 60, 180)}ms`;
        entry.target.classList.add("is-visible");

        /* Una vez mostrado dejamos de vigilarlo. Así no se vuelve a animar
           al subir y bajar, y de paso el navegador tiene menos trabajo. */
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,              // basta con que se vea un 8% del elemento
      rootMargin: "0px 0px 15% 0px" // se adelanta un poco: empieza antes de que llegue del todo
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  /* Red de seguridad. Si por lo que sea el observador no llegara a
     dispararse, a los 3 segundos mostramos todo igualmente. Es preferible
     perder la animación a que alguien se quede mirando una página en blanco. */
  window.setTimeout(revealAll, 3000);
} else {
  revealAll();
}


/* ---------- Subrayar en el menú la sección que estás mirando ----------
   Se conoce como "scrollspy". */

// De cada enlace del menú sacamos el elemento al que apunta su href (#about,
// #skills...). El filter(Boolean) descarta los que no existan, como el
// botón "Hablemos", para no acabar con nulls en la lista.
const navLinks = Array.from(document.querySelectorAll(".nav__link"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (sections.length && "IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Marcamos el enlace que coincide con la sección y desmarcamos el resto
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    /* Los márgenes negativos recortan la zona que se considera "visible"
       hasta dejar una franja estrecha en mitad de la pantalla. Sin esto,
       con dos secciones a la vista, las dos contarían y el subrayado
       daría saltos. */
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => spy.observe(section));
}


/* ---------- El brillo que sigue al ratón por las tarjetas ----------
   El efecto en sí lo pinta el CSS: hay un degradado colocado en las
   coordenadas --mx y --my. Desde aquí solo vamos actualizando esos dos
   valores con la posición del cursor.

   El (hover: hover) es para saltarnos esto en móviles y tabletas, donde
   no hay puntero que seguir y solo sería trabajo de más. */
if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".spot").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      /* clientX y clientY vienen medidos desde la esquina de la ventana,
         pero el CSS los necesita medidos desde la esquina de la tarjeta.
         Restando la posición de la tarjeta pasamos de un sistema al otro. */
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });
}


/* ---------- El texto que se escribe solo en la portada ---------- */
const typedEl = document.querySelector("#typed");

// Las frases van rotando en este orden y vuelven a empezar
const ROLES = [
  "Desarrollador de aplicaciones",
  "Java · Spring Boot",
  "Desarrollo web full stack",
  "Bases de datos y SQL",
  "Firebase · Supabase",
];

if (typedEl) {
  if (prefersReducedMotion) {
    // Sin animación: dejamos la primera frase puesta y listo
    typedEl.textContent = ROLES[0];
  } else {
    let roleIndex = 0;   // en qué frase estamos
    let charIndex = 0;   // cuántas letras hay escritas
    let deleting = false; // ¿estamos borrando o escribiendo?

    const tick = () => {
      const role = ROLES[roleIndex];

      // Una letra más si escribimos, una menos si borramos
      charIndex += deleting ? -1 : 1;

      /* slice(0, charIndex) devuelve la frase cortada por esa letra.
         Como se recalcula entera cada vez, no hace falta ir pegando
         y quitando caracteres a mano. */
      typedEl.textContent = role.slice(0, charIndex);

      // Borrar más rápido que escribir es lo que hace que parezca natural
      let delay = deleting ? 40 : 75;

      if (!deleting && charIndex === role.length) {
        // Frase terminada: pausa para que dé tiempo a leerla y a borrar
        deleting = true;
        delay = 1900;
      } else if (deleting && charIndex === 0) {
        // Frase borrada: pasamos a la siguiente
        deleting = false;
        /* El % (resto de la división) hace que después de la última frase
           volvamos a la 0, sin tener que comprobar el final a mano. */
        roleIndex = (roleIndex + 1) % ROLES.length;
        delay = 350;
      }

      /* La función se llama a sí misma pasado el retardo. Usamos setTimeout
         encadenado en vez de setInterval porque así cada paso puede durar
         algo distinto (escribir, borrar, la pausa larga...). */
      window.setTimeout(tick, delay);
    };

    tick(); // arrancamos
  }
}


/* ---------- Botón de copiar el email ---------- */
document.querySelectorAll(".copyBtn").forEach((button) => {
  // async porque copiar al portapapeles devuelve una promesa
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;      // lo que hay en data-copy="..." en el HTML
    const original = button.textContent;    // lo guardamos para restaurarlo luego

    try {
      await navigator.clipboard.writeText(value);
      button.textContent = "¡Copiado!";
    } catch {
      /* Algunos navegadores no dejan copiar si la página no va por https
         o si el usuario no ha dado permiso. En ese caso al menos mostramos
         el correo para que pueda copiarlo a mano. */
      button.textContent = value;
    }

    button.classList.add("is-copied");

    // A los dos segundos el botón vuelve a estar como estaba
    window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove("is-copied");
    }, 2000);
  });
});


/* ---------- Los proyectos, sacados de la API de GitHub ----------
   En vez de escribir las tarjetas a mano en el HTML, se las pedimos a
   GitHub al cargar la página. Así, cuando suba un repositorio nuevo o
   cambie una descripción, la web se actualiza sola. */
const projectsGrid = document.querySelector("#projectsGrid");

/* Los colorines que GitHub le asigna a cada lenguaje, para el puntito de
   cada tarjeta. Si aparece un lenguaje que no está en la lista, más abajo
   usamos el azul de la web por defecto. */
const LANG_COLORS = {
  Java: "#b07219",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  PHP: "#4F5D95",
  Python: "#3572A5",
  "C#": "#178600",
  Kotlin: "#A97BFF",
  SQLPL: "#e38c00",
  Dockerfile: "#384d54",
};

/* Esto es importante: los nombres y descripciones vienen de fuera, y más
   abajo los metemos en el HTML. Si alguien pusiera etiquetas en la
   descripción de un repositorio, el navegador se las creería y las
   ejecutaría. Cambiando los caracteres peligrosos por su equivalente
   "escapado" (&lt; en vez de <), el navegador los pinta como texto.
   Es la defensa básica contra lo que se llama XSS. */
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
  );

/* GitHub devuelve las fechas en formato ISO (2026-08-31T12:00:00Z).
   Esto las deja en algo legible como "ago 2026". */
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("es-ES", { month: "short", year: "numeric" });

// Construye el HTML de las tarjetas y lo mete en la página
const renderProjects = (repos) => {
  projectsGrid.innerHTML = repos
    .map((repo) => {
      const color = LANG_COLORS[repo.language] || "#38bdf8";

      // Hay repositorios sin lenguaje detectado; en esos no pintamos nada
      const language = repo.language
        ? `<span class="projectCard__lang"><span class="projectCard__dot" style="background:${color}"></span>${escapeHtml(repo.language)}</span>`
        : "";

      /* Las comillas invertidas (`) permiten escribir varias líneas y meter
         valores dentro con ${...}. Se llaman plantillas literales. */
      return `
        <a class="card projectCard spot" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
          <div class="projectCard__top">
            <h3>${escapeHtml(repo.name)}</h3>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.3 5.3 12 6.7l4.3 4.3H4v2h12.3L12 17.3l1.3 1.4 6.7-6.7-6.7-6.7Z"/></svg>
          </div>
          <p class="projectCard__desc">${escapeHtml(repo.description || "Repositorio sin descripción.")}</p>
          <div class="projectCard__meta">
            ${language}
            <span>★ ${repo.stargazers_count}</span>
            <span>Actualizado ${formatDate(repo.pushed_at)}</span>
          </div>
        </a>`;
    })
    .join(""); // map devuelve un array de textos; join los pega en uno solo

  // Avisamos de que ya no se está cargando (esto lo leen los lectores de pantalla)
  projectsGrid.setAttribute("aria-busy", "false");
};

/* Plan B por si GitHub no responde: le pasa a cualquiera, y es mejor
   ofrecer un enlace que dejar tres tarjetas grises para siempre. */
const renderProjectsFallback = () => {
  projectsGrid.setAttribute("aria-busy", "false");
  projectsGrid.innerHTML = `
    <p class="emptyState">
      No se han podido cargar los repositorios ahora mismo.
      Puedes verlos directamente en
      <a class="contactCard__link" href="https://github.com/adanprog?tab=repositories" target="_blank" rel="noreferrer">github.com/adanprog</a>.
    </p>`;
};

if (projectsGrid) {
  /* fetch pide datos a otra web. Como tarda, devuelve una promesa: un
     "ya te aviso cuando esté". Los .then se van encadenando con lo que
     hay que hacer cuando llegue la respuesta. */
  fetch("https://api.github.com/users/adanprog/repos?sort=pushed&per_page=100")
    .then((response) => {
      /* Ojo: fetch no falla solo porque el servidor conteste con un error.
         Un 404 o un 403 llegan aquí como respuesta normal, así que hay que
         mirar response.ok a mano y lanzar el error nosotros. */
      if (!response.ok) throw new Error(`GitHub respondió ${response.status}`);
      return response.json(); // convierte el texto recibido en objetos JS
    })
    .then((repos) => {
      const visible = repos
        // Fuera los forks, los archivados y el repositorio de esta propia web
        .filter((repo) => !repo.fork && !repo.archived && repo.name !== "adanprog")
        .slice(0, 6); // como mucho seis, que si no la sección se hace eterna

      if (!visible.length) {
        renderProjectsFallback();
        return;
      }

      renderProjects(visible);

      /* Las tarjetas de proyectos se han creado ahora mismo, así que no
         existían cuando arriba repartimos el efecto de luz. Hay que
         dárselo también a ellas. */
      if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
        projectsGrid.querySelectorAll(".spot").forEach((card) => {
          card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
            card.style.setProperty("--my", `${event.clientY - rect.top}px`);
          });
        });
      }
    })
    // Si algo se tuerce (sin internet, GitHub caído, límite de peticiones...)
    .catch(renderProjectsFallback);
}
