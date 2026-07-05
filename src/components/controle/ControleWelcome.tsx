import React from 'react';
import ControleCoachPanel from './ControleCoachPanel';

interface ControleWelcomeProps {
    onStart: () => void;
}

const ControleWelcome: React.FC<ControleWelcomeProps> = ({ onStart }) => (
    <div className="controle-screen">
        <ControleCoachPanel step="welcome" />
        <div className="controle-hero">
            <div className="controle-eyebrow">Programme personnel</div>
            <h1>
                La Voie du <em>Contrôle</em>
            </h1>
            <p>
                Trois communautés abordent le contrôle de l'éjaculation avec des méthodes très
                différentes : la médecine comportementale occidentale, la pratique taoïste de Mantak
                Chia, et la discipline mentale des communautés de rétention séminale.
            </p>
            <p style={{ marginTop: 10 }}>
                Ce programme garde ce qui tient la route dans chacune, et l'organise en 4 phases
                progressives — avec un suivi et une projection de résultats.
            </p>

            <div className="controle-tier-legend">
                <div className="controle-tier-pill">
                    <span className="controle-dot clin" /> Validé cliniquement
                </div>
                <div className="controle-tier-pill">
                    <span className="controle-dot trad" /> Pratique traditionnelle
                </div>
                <div className="controle-tier-pill">
                    <span className="controle-dot psy" /> Levier psychologique
                </div>
            </div>

            <div className="controle-source-cards">
                <div className="controle-source-card">
                    <h4>
                        <span className="controle-dot clin" /> Médecine comportementale
                    </h4>
                    <p>
                        Arrêt-départ, compression (Masters &amp; Johnson) et renforcement du
                        plancher pelvien. Les études les mieux conduites montrent un gain réel —
                        jusqu'à 4x le temps de contrôle en 8 à 12 semaines pour le travail du
                        plancher pelvien.
                    </p>
                </div>
                <div className="controle-source-card">
                    <h4>
                        <span className="controle-dot trad" /> Taoïsme — Mantak Chia
                    </h4>
                    <p>
                        Verrouillage du muscle PC, respiration et redirection de l'attention (« Grand
                        Tirage »). Peu d'essais cliniques, mais un mécanisme cohérent avec la
                        médecine moderne : mêmes muscles, même respiration, cadre mental différent.
                    </p>
                </div>
                <div className="controle-source-card">
                    <h4>
                        <span className="controle-dot psy" /> Rétention / discipline
                    </h4>
                    <p>
                        Les bénéfices physiologiques annoncés (énergie, testostérone) ne sont pas
                        soutenus par la science. En revanche, le suivi de streak, le journaling et
                        le travail d'identité ont une vraie valeur d'engagement.
                    </p>
                </div>
            </div>

            <button type="button" className="controle-btn controle-btn-primary controle-btn-block" onClick={onStart}>
                Évaluer mon état actuel
            </button>

            <div className="controle-disclaimer">
                <p>
                    Outil éducatif et auto-dirigé, construit à partir de sources publiques (études
                    cliniques et littérature taoïste). Il ne remplace pas un avis médical. Si la
                    difficulté persiste ou te pèse, un urologue ou un·e sexologue peut t'aider
                    directement.
                </p>
            </div>
        </div>
    </div>
);

export default ControleWelcome;
