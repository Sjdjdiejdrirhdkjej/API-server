'use client';

type ISignInGreetingProps = {
  firstName?: string;
};

export function SignInGreeting(props: ISignInGreetingProps) {
  if (!props.firstName) {
    return null;
  }

  return (
    <div className="mb-4 text-center text-lg">
      Welcome back,
      {' '}
      {props.firstName}
      !
    </div>
  );
}
