type Props = {
  message: string
}

export default function LoginToast({ message }: Props) {
  return (
    <div className="home-toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
