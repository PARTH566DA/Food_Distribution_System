@RestController
public class PingController {

    @GetMapping("/ping")
    public String ping() {
        return "OK";
    }
}