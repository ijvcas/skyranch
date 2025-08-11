import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Edit, UserMinus, Trash2 } from 'lucide-react';
import { type AppUser } from '@/services/userService';
import CompleteDeleteDialog from './CompleteDeleteDialog';

interface UsersTableProps {
  users: AppUser[];
  currentUser: AppUser | null;
  onEditUser: (user: AppUser) => void;
  onDeleteUser: (id: string, name: string) => void;
  onCompleteDeleteUser: (id: string, name: string) => void;
  onToggleStatus: (id: string, name: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
  isCompleteDeleting: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  currentUser,
  onEditUser,
  onDeleteUser,
  onCompleteDeleteUser,
  onToggleStatus,
  isToggling,
  isDeleting,
  isCompleteDeleting
}) => {
  const [completeDeleteDialog, setCompleteDeleteDialog] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    userId: '',
    userName: ''
  });

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente',
      worker: 'Trabajador'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      worker: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'No registrado';
    return phone;
  };

  const handleCompleteDeleteClick = (userId: string, userName: string) => {
    setCompleteDeleteDialog({
      isOpen: true,
      userId,
      userName
    });
  };

  const handleCompleteDeleteConfirm = () => {
    onCompleteDeleteUser(completeDeleteDialog.userId, completeDeleteDialog.userName);
    setCompleteDeleteDialog({
      isOpen: false,
      userId: '',
      userName: ''
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Usuario</TableHead>
                  <TableHead className="min-w-[120px]">Teléfono</TableHead>
                  <TableHead className="min-w-[100px]">Rol</TableHead>
                  <TableHead className="min-w-[120px]">Estado</TableHead>
                  <TableHead className="min-w-[120px]">Fecha Registro</TableHead>
                  <TableHead className="min-w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{formatPhone(user.phone)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => onToggleStatus(user.id, user.name)}
                          disabled={currentUser?.id === user.id || isToggling}
                        />
                        <span className="text-sm">
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => onEditUser(user)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-8 h-8 p-0"
                          title="Editar usuario"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => onDeleteUser(user.id, user.name)}
                          variant="ghost"
                          size="sm"
                          disabled={currentUser?.id === user.id || isDeleting}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 w-8 h-8 p-0"
                          title="Eliminar de la app (puede reaparecer)"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleCompleteDeleteClick(user.id, user.name)}
                          variant="ghost"
                          size="sm"
                          disabled={currentUser?.id === user.id || isCompleteDeleting}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0"
                          title="Eliminar completamente (permanente)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CompleteDeleteDialog
        isOpen={completeDeleteDialog.isOpen}
        onOpenChange={(open) => setCompleteDeleteDialog(prev => ({ ...prev, isOpen: open }))}
        onConfirm={handleCompleteDeleteConfirm}
        userName={completeDeleteDialog.userName}
        isDeleting={isCompleteDeleting}
      />
    </>
  );
};

export default UsersTable;
