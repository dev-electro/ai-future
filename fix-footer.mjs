import fs from 'fs';
const file = './pages/jobs/[slug].js';
let code = fs.readFileSync(file, 'utf8');

// The file currently ends with:
//       </main>
//
//       <footer ...> ... </footer>
//     </>
//   );
// }

// The footer is ALREADY inside the fragment <> and inside the return ().
// WAIT! Is it? Let's check the AST.
console.log(code.slice(code.length - 200));
