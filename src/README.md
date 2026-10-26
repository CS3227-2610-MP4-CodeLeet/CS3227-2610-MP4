# Application source

The executable app foundation is in app/ (layout, home page, styles), with shared utilities in lib/ and shadcn components configured under components/ui/. The @/* alias resolves here. Keep future Next.js pages/routes, shared UI, domain services and browser runtime adapters in src.

Authentication, migrations, assignment creation and the AI gateway remain teammate-owned. No fake sign-in, fixture API or privileged Supabase client is provided by the bootstrap.
