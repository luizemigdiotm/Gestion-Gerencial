import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full border-t-4 border-red-500">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full mb-4">
                                <AlertTriangle className="text-red-500" size={32} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
                            <p className="text-gray-600 mb-6">
                                Ha ocurrido un error inesperado en la aplicación.
                            </p>

                            <div className="w-full bg-gray-50 p-4 rounded-lg text-left mb-6 overflow-auto max-h-40 border border-gray-200">
                                <p className="font-mono text-xs text-red-600 whitespace-pre-wrap">
                                    {this.state.error?.toString()}
                                </p>
                            </div>

                            <button
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Recargar Página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
