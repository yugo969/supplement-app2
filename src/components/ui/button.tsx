import { Button } from 'shadcn-ui';

export const MyButton = ({ children, ...props }) => (
  <Button {...props}>{children}</Button>
);
