
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800';
    case 'sick':
      return 'bg-red-100 text-red-800';
    case 'pregnant':
      return 'bg-blue-100 text-blue-800';
    case 'pregnant-healthy':
      return 'bg-emerald-100 text-emerald-800';
    case 'pregnant-sick':
      return 'bg-orange-100 text-orange-800';
    case 'treatment':
      return 'bg-yellow-100 text-yellow-800';
    case 'deceased':
      return 'bg-gray-100 text-gray-600 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'Saludable';
    case 'sick':
      return 'Enfermo';
    case 'pregnant':
      return 'Gestante';
    case 'pregnant-healthy':
      return 'Gestante Saludable';
    case 'pregnant-sick':
      return 'Gestante Enferma';
    case 'treatment':
      return 'En Tratamiento';
    case 'deceased':
      return 'Fallecido';
    default:
      return 'Saludable';
  }
};
