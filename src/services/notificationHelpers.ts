import { addNotification } from './dataService';

/**
 * Helper para criar notificações automáticas no sistema
 */

export const createContractNotification = async (contractId: string | number, propertyTitle: string, type: 'created' | 'expiring') => {
    const notification = {
        type: 'contract',
        title: type === 'created' ? 'Novo Contrato Criado' : 'Contrato Próximo do Vencimento',
        message: type === 'created'
            ? `Um novo contrato foi criado para o imóvel "${propertyTitle}".`
            : `O contrato do imóvel "${propertyTitle}" vence em breve.`,
        icon: 'gavel',
        priority: type === 'expiring' ? 'high' : 'medium'
    };

    await addNotification(notification);
};

export const createPaymentNotification = async (amount: number, propertyTitle: string) => {
    const notification = {
        type: 'payment',
        title: 'Pagamento Recebido',
        message: `Pagamento de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebido para "${propertyTitle}".`,
        icon: 'payments',
        priority: 'medium'
    };

    await addNotification(notification);
};

export const createLeadNotification = async (userName: string, propertyTitle?: string) => {
    const notification = {
        type: 'lead',
        title: 'Novo Lead Capturado',
        message: propertyTitle
            ? `${userName} demonstrou interesse em "${propertyTitle}".`
            : `Novo lead: ${userName} entrou em contato.`,
        icon: 'person_add',
        priority: 'high'
    };

    await addNotification(notification);
};

export const createPropertyNotification = async (propertyTitle: string, action: 'created' | 'sold' | 'rented') => {
    const titles = {
        created: 'Novo Imóvel Cadastrado',
        sold: 'Imóvel Vendido',
        rented: 'Imóvel Alugado'
    };

    const messages = {
        created: `O imóvel "${propertyTitle}" foi cadastrado no sistema.`,
        sold: `O imóvel "${propertyTitle}" foi vendido com sucesso!`,
        rented: `O imóvel "${propertyTitle}" foi alugado.`
    };

    const notification = {
        type: 'property',
        title: titles[action],
        message: messages[action],
        icon: 'home',
        priority: action === 'created' ? 'low' : 'medium'
    };

    await addNotification(notification);
};

export const createSystemNotification = async (title: string, message: string) => {
    const notification = {
        type: 'system',
        title,
        message,
        icon: 'info',
        priority: 'low'
    };

    await addNotification(notification);
};
