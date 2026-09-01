import Avatar from '@/components/common/Avatar';

export default function ChatAvatar({
  name,
  src,
  online,
  size = 'l'
}: {
  name: string;
  src?: string | null;
  online: boolean;
  size?: string;
}) {
  return (
    <span className="chat-avatar">
      <Avatar name={name} src={src} size={size} round="circle" />
      <span
        className={`chat-presence ${online ? 'is-online' : ''}`.trim()}
        title={online ? `${name} is active now` : `${name} is away`}
      />
    </span>
  );
}
