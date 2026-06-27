export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {Icon && (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Icon size={28} className="text-text-light" />
                </div>
            )}
            <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-text-light max-w-sm mb-6">{description}</p>
            )}
            {action}
        </div>
    );
}
