import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

import {
    FilePlus2,
    Landmark,
    LayoutDashboard,
    LogOut,
    Menu,
    ReceiptText,
    UserCog,
    Users,
    X,
} from 'lucide-react';

/* ---------- Solo presentación ---------- */
const Categoria = ({ titulo, children }) => (
    <div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-border">{titulo}</p>
        <div className="space-y-1">{children}</div>
    </div>
);

const ItemMenu = ({ icon: Icon, active = false, children, ...props }) => (
    <Link
        {...props}
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active
                ? 'bg-secondary text-primary shadow-sm'
                : 'text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground'
        }`}
    >
        <Icon className={`size-5 shrink-0 ${active ? 'text-primary' : 'text-border group-hover:text-primary-foreground'}`} />
        <span className="truncate">{children}</span>
        {active && <span className="ms-auto size-1.5 rounded-full bg-primary" />}
    </Link>
);

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-secondary/40">
            {/* Fondo oscuro al abrir el menú en móvil */}
            {showingNavigationDropdown && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={() => setShowingNavigationDropdown(false)}
                    aria-hidden="true"
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-primary text-primary-foreground shadow-xl transition-transform duration-200 lg:translate-x-0 ${
                    showingNavigationDropdown ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/30 px-5">
                    <Link href="/" className="flex items-center gap-3">
                        <ApplicationLogo className="block h-9 w-auto fill-current text-primary-foreground" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setShowingNavigationDropdown(false)}
                        className="rounded-lg p-1.5 text-border hover:bg-white/10 lg:hidden"
                        aria-label="Cerrar menú"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Navegación por categorías */}
                <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
                    <Categoria titulo="General">
                        <ItemMenu
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            icon={LayoutDashboard}
                        >
                            Dashboard
                        </ItemMenu>
                    </Categoria>

                    <Categoria titulo="Facturación">
                        <ItemMenu
                            href={route('facturas.create')}
                            active={route().current('facturas.create')}
                            icon={FilePlus2}
                        >
                            Facturas
                        </ItemMenu>
                        <ItemMenu
                            href={route('facturas.index')}
                            active={route().current('facturas.index')}
                            icon={ReceiptText}
                        >
                            Facturas emitidas
                        </ItemMenu>
                    </Categoria>

                    <Categoria titulo="Administración">
                        <ItemMenu
                            href={route('clientes.index')}
                            active={route().current('clientes.index')}
                            icon={Users}
                        >
                            Clientes
                        </ItemMenu>
                        <ItemMenu
                            href={route('emisor.index')}
                            active={route().current('emisor.index')}
                            icon={Landmark}
                        >
                            Emisor
                        </ItemMenu>
                    </Categoria>

                    <Categoria titulo="Cuenta">
                        <ItemMenu href={route('profile.edit')} icon={UserCog}>
                            Profile
                        </ItemMenu>
                        <ItemMenu href={route('logout')} method="post" as="button" icon={LogOut}>
                            Log Out
                        </ItemMenu>
                    </Categoria>
                </nav>

                {/* Usuario */}
                <div className="shrink-0 border-t border-border/30 p-4">
                    <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-primary">
                            {user.name?.trim()?.[0]?.toUpperCase() ?? '?'}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{user.name}</p>
                            <p className="truncate text-xs text-primary-foreground/70">{user.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* CONTENIDO */}
            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 border-b border-border/40 bg-white/90 backdrop-blur">
                    <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            onClick={() =>
                                setShowingNavigationDropdown(
                                    (previousState) => !previousState,
                                )
                            }
                            className="inline-flex items-center justify-center rounded-lg p-2 text-primary transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-border lg:hidden"
                            aria-label="Abrir menú"
                        >
                            <Menu className="size-6" />
                        </button>

                        <div className="min-w-0 flex-1">{header}</div>
                    </div>
                </header>

                <main>{children}</main>
            </div>
        </div>
    );
}
