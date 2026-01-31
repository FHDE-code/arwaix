
const translations = {
  fr: {
    nav_home: "Accueil",
    nav_project: "Le Projet",
    nav_rules: "Règles d'Honneur",
    nav_download: "Téléchargement",
    help_text: "Besoin d'aide ?",
    welcome_title: "Bienvenue sur Arwaix",
    welcome_desc: "Un projet pour équilibrer le monde et mettre fin à la souffrance."
  },
  en: {
    nav_home: "Home",
    nav_project: "The Project",
    nav_rules: "Honor Rules",
    nav_download: "Download",
    help_text: "Need Help?",
    welcome_title: "Welcome to Arwaix",
    welcome_desc: "A project to balance the world and end suffering."
  }
};

/************************
 * TEXTE BINAIRE FLOTTANT
 ************************/
// On crée un conteneur pour ne pas polluer le body directement
const binaryContainer = document.createElement("div");
binaryContainer.style.pointerEvents = "none";
document.body.appendChild(binaryContainer);

for (let i = 0; i < 40; i++) { // Augmenté à 40 pour plus d'effet
  const span = document.createElement("span");
  span.textContent = Math.random() > 0.5 ? "0" : "1";
  span.className = "binary-text";

  Object.assign(span.style, {
    position: "fixed",
    left: Math.random() * 100 + "vw",
    top: Math.random() * 100 + "vh",
    fontSize: 12 + Math.random() * 12 + "px",
    /* ✅ Correction : currentColor permet de suivre le cycle de couleurs du CSS */
    color: "inherit", 
    opacity: "0.3",
    zIndex: "0",
    pointerEvents: "none",
    animation: `floatBinary ${10 + Math.random() * 10}s linear infinite`
  });

  binaryContainer.appendChild(span);
}

// Ajout de l'animation binaire si elle n'existe pas
if (!document.getElementById("binary-style")) {
  const style = document.createElement("style");
  style.id = "binary-style";
  style.innerHTML = `
    @keyframes floatBinary {
      from { transform: translateY(110vh) rotate(0deg); }
      to { transform: translateY(-120vh) rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

/************************
 * SECTIONS 3D SUR SURVOL
 ************************/
const sections = document.querySelectorAll("section");

sections.forEach(section => {
  section.style.transformStyle = "preserve-3d";
  section.style.transition = "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)";
  section.style.willChange = "transform";

  section.addEventListener("mousemove", e => {
    const rect = section.getBoundingClientRect();
    // On calcule la position de la souris par rapport au centre de la section
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    section.style.transform = `
      perspective(1000px)
      rotateX(${y * -10}deg)
      rotateY(${x * 10}deg)
      translateZ(20px)
    `;
  });

  section.addEventListener("mouseleave", () => {
    section.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)";
  });
});

/************************
 * MENU → SCROLL HORIZONTAL SMOOTH
 ************************/
document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const targetId = link.getAttribute("href");
    const target = document.querySelector(targetId);
    
    if (target) {
      /* ✅ Correction : inline: "center" est parfait pour le défilement horizontal */
      target.scrollIntoView({
        behavior: "smooth",
        inline: "center", 
        block: "nearest"
      });
    }
  });
});

/************************
 * GESTION PARAMÈTRES (Langue & Aide)
 ************************/

// Bouton Aide
document.getElementById('help-btn').addEventListener('click', () => {
  alert("Bienvenue dans l'interface Arwaix.\n\n- Naviguez horizontalement avec la molette ou le menu.\n- Les couleurs changent cycliquement pour refléter l'équilibre.\n- Cliquez sur 'Télécharger' pour obtenir les ressources du projet.");
});

// Changement de Langue (Exemple simple)
document.getElementById('lang-select').addEventListener('change', (e) => {
  const lang = e.target.value;
  if(lang === 'en') {
    alert("English language selected. (Connect your translation API or JSON here)");
    // Ici tu pourrais charger un fichier JSON de traduction
  } else {
    alert("Français sélectionné.");
  }
});

/************************
 * BARRE DE PROGRESSION HORIZONTALE
 ************************/
window.addEventListener("scroll", () => {
  // Calcul du pourcentage de défilement horizontal
  const winScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
  const width = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const scrolled = (winScroll / width) * 100;
  
  // Mise à jour de la largeur de la barre
  document.getElementById("progress-bar").style.width = scrolled + "%";
});

function updateLanguage(lang) {
  const elements = document.querySelectorAll("[data-key]");
  
  elements.forEach(el => {
    const key = el.getAttribute("data-key");
    if (translations[lang][key]) {
      // Si c'est un bouton ou un lien
      el.textContent = translations[lang][key];
    }
  });
  
  // Optionnel : Sauvegarder le choix de l'utilisateur
  localStorage.setItem("selectedLang", lang);
}

// Écouteur sur le menu déroulant
document.getElementById('lang-select').addEventListener('change', (e) => {
  updateLanguage(e.target.value);
});

// Au chargement de la page : appliquer la langue sauvegardée ou français par défaut
window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("selectedLang") || "fr";
  document.getElementById('lang-select').value = savedLang;
  updateLanguage(savedLang);
});