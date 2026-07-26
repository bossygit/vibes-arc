import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

/**
 * Error boundary simple pour capturer les erreurs de rendu
 * et afficher un fallback au lieu de planter toute la page.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary a capturé une erreur:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="p-4 text-center text-sm text-slate-500">
                    Une erreur est survenue dans cette section.
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
