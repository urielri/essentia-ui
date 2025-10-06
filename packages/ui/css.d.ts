declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Mantenemos la declaración para archivos CSS simples si la necesitas:
declare module "*.css" {
  const content: string;
  export default content;
}
