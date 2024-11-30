import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
    try {
      const sql = neon(`${process.env.DATABASE_URL}`);
      const { first_name, last_name, email, clerkId } = await request.json();
  
      if (!first_name || !last_name || !email || !clerkId) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }
  
      const response = await sql`
        INSERT INTO users (
          first_name,
          last_name, 
          email, 
          clerk_id
        ) 
        VALUES (
          ${first_name}, 
          ${last_name}, 
          ${email},
          ${clerkId}
       );`;
  
      return new Response(JSON.stringify({ data: response }), {
        status: 201,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }



