import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath(); // Reset path
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Check if canvas is empty? (Simplified)
            onSave(canvas.toDataUrl('image/png'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Assinatura Digital</h3>
                        <p className="text-xs text-slate-500 font-medium">Desenhe sua assinatura no campo abaixo</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>

                <div className="p-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 relative h-64 cursor-crosshair overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={256}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-full touch-none"
                        />
                    </div>
                    <div className="mt-4 flex gap-4">
                        <button
                            onClick={clear}
                            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm font-bold">delete</span> Limpar
                        </button>
                        <button
                            onClick={save}
                            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm font-bold">verified</span> Confirmar Assinatura
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-[20px]">info</span>
                    <p className="text-[11px] text-amber-800 leading-normal">
                        Ao assinar, você concorda com os termos do contrato e reconhece esta assinatura como válida para fins jurídicos conforme a MP 2.200-2/2001.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
