type Props = {
  message: string
}

export default function AdminToast({ message }: Props) {
  return (
    <div className="admin-toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
