import Avatar from '@/components/common/Avatar';

/**
 * A face with a presence dot. The dot is drawn here rather than by `Avatar`'s
 * own `status` prop so it reads the same at every size the chat UI uses, and
 * so an offline contact gets a hollow marker instead of no marker at all.
 */
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
