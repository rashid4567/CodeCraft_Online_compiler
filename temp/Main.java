// Welcome to Rashid's Compiler - Java Edition! ☕
// Try running this sample code:

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World! 🌍");
        System.out.println("5 + 3 = " + (5 + 3));
        System.out.println("4 * 6 = " + (4 * 6));
        
        // Working with arrays
        int[] numbers = {1, 2, 3, 4, 5};
        
        System.out.print("Original numbers: ");
        for (int num : numbers) {
            System.out.print(num + " ");
        }
        System.out.println();
        
        // Double each number
        System.out.print("Doubled numbers: ");
        for (int num : numbers) {
            System.out.print((num * 2) + " ");
        }
        System.out.println();
        
        // Array of strings
        String[] courses = {"JavaScript", "Python", "Java"};
        System.out.println("\nAvailable courses:");
        for (String course : courses) {
            System.out.println("- " + course);
        }
        
        // Simple loop
        System.out.println("\nCounting to 5:");
        for (int i = 1; i <= 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}