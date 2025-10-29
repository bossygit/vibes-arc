import { WeeklyReport } from '@/utils/weeklyReportUtils';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/config/emailjs';

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

export function generateWeeklyEmailTemplate(report: WeeklyReport): EmailTemplate {
    const subject = `📊 Résumé hebdomadaire Vibes Arc - Semaine du ${report.weekStart.toLocaleDateString('fr-FR')}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Résumé hebdomadaire Vibes Arc</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #2d3748; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
        .stat-number { font-size: 32px; font-weight: bold; color: #2d3748; margin-bottom: 5px; }
        .stat-label { color: #718096; font-size: 14px; }
        .habit-list { background: #f0fff4; padding: 15px; border-radius: 8px; border-left: 4px solid #48bb78; }
        .habit-item { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .habit-item:last-child { border-bottom: none; }
        .insight { background: #ebf8ff; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #3182ce; }
        .goal { background: #fef5e7; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #ed8936; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; }
        .emoji { font-size: 18px; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Résumé Hebdomadaire</h1>
            <p>Semaine du ${report.weekStart.toLocaleDateString('fr-FR')} au ${report.weekEnd.toLocaleDateString('fr-FR')}</p>
        </div>
        
        <div class="content">
            <!-- Statistiques générales -->
            <div class="section">
                <h2>📈 Vue d'ensemble</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${report.habits.completionRate.toFixed(0)}%</div>
                        <div class="stat-label">Taux de réussite</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${report.habits.completed}/${report.habits.total}</div>
                        <div class="stat-label">Habitudes actives</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${report.habits.newStreaks}</div>
                        <div class="stat-label">Nouvelles séries</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${report.gamification.currentPoints}</div>
                        <div class="stat-label">Points totaux</div>
                    </div>
                </div>
            </div>

            <!-- Meilleures performances -->
            ${report.habits.topPerforming.length > 0 ? `
            <div class="section">
                <h2>⭐ Meilleures performances</h2>
                <div class="habit-list">
                    ${report.habits.topPerforming.map(habit => `
                        <div class="habit-item">
                            <strong>${habit.name}</strong> - Excellente progression cette semaine !
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Habitudes à améliorer -->
            ${report.habits.struggling.length > 0 ? `
            <div class="section">
                <h2>🎯 Habitudes à améliorer</h2>
                <div class="habit-list" style="background: #fef2f2; border-left-color: #f56565;">
                    ${report.habits.struggling.map(habit => `
                        <div class="habit-item">
                            <strong>${habit.name}</strong> - Concentrez-vous sur cette habitude la semaine prochaine
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Identités -->
            <div class="section">
                <h2>👤 Progression des identités</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${report.identities.active}</div>
                        <div class="stat-label">Identités actives</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${report.identities.total}</div>
                        <div class="stat-label">Total identités</div>
                    </div>
                </div>
            </div>

            <!-- Insights -->
            ${report.insights.length > 0 ? `
            <div class="section">
                <h2>💡 Insights de la semaine</h2>
                ${report.insights.map(insight => `
                    <div class="insight">
                        <span class="emoji">${insight.split(' ')[0]}</span>${insight.substring(insight.indexOf(' ') + 1)}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Objectifs pour la semaine prochaine -->
            ${report.nextWeekGoals.length > 0 ? `
            <div class="section">
                <h2>🎯 Objectifs pour la semaine prochaine</h2>
                ${report.nextWeekGoals.map(goal => `
                    <div class="goal">
                        <span class="emoji">•</span>${goal}
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Continuez votre parcours de développement personnel avec Vibes Arc !</p>
            <p>Vous recevez cet email car vous avez activé les résumés hebdomadaires.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
RÉSUMÉ HEBDOMADAIRE VIBES ARC
Semaine du ${report.weekStart.toLocaleDateString('fr-FR')} au ${report.weekEnd.toLocaleDateString('fr-FR')}

📈 VUE D'ENSEMBLE
- Taux de réussite: ${report.habits.completionRate.toFixed(0)}%
- Habitudes actives: ${report.habits.completed}/${report.habits.total}
- Nouvelles séries: ${report.habits.newStreaks}
- Points totaux: ${report.gamification.currentPoints}

${report.habits.topPerforming.length > 0 ? `
⭐ MEILLEURES PERFORMANCES
${report.habits.topPerforming.map(habit => `- ${habit.name}`).join('\n')}
` : ''}

${report.habits.struggling.length > 0 ? `
🎯 HABITUDES À AMÉLIORER
${report.habits.struggling.map(habit => `- ${habit.name}`).join('\n')}
` : ''}

👤 IDENTITÉS
- Identités actives: ${report.identities.active}
- Total identités: ${report.identities.total}

${report.insights.length > 0 ? `
💡 INSIGHTS DE LA SEMAINE
${report.insights.map(insight => `- ${insight}`).join('\n')}
` : ''}

${report.nextWeekGoals.length > 0 ? `
🎯 OBJECTIFS POUR LA SEMAINE PROCHAINE
${report.nextWeekGoals.map(goal => `- ${goal}`).join('\n')}
` : ''}

Continuez votre parcours de développement personnel avec Vibes Arc !
`;

    return { subject, html, text };
}

// Fonction pour envoyer l'email avec EmailJS
export async function sendWeeklyEmail(report: WeeklyReport, userEmail: string): Promise<boolean> {
    try {
        // Initialiser EmailJS
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

        // Préparer les données pour le template
        const templateParams = {
            to_email: userEmail,
            week_start: report.weekStart.toLocaleDateString('fr-FR'),
            week_end: report.weekEnd.toLocaleDateString('fr-FR'),
            completion_rate: report.habits.completionRate.toFixed(0),
            habits_completed: report.habits.completed,
            habits_total: report.habits.total,
            new_streaks: report.habits.newStreaks,
            total_points: report.gamification.currentPoints,
            top_habits: report.habits.topPerforming.map(h => h.name),
            struggling_habits: report.habits.struggling.map(h => h.name),
            active_identities: report.identities.active,
            total_identities: report.identities.total,
            insights: report.insights,
            next_week_goals: report.nextWeekGoals
        };

        console.log('Envoi de l\'email avec EmailJS:', templateParams);

        // Envoyer l'email
        const result = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams
        );

        console.log('Email envoyé avec succès:', result);
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        return false;
    }
}
